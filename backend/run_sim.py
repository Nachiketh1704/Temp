#!/usr/bin/env python3
"""CLI for running SAR simulation. Usage: run_sim.py [--scenario rescue_seeded] [--record FILE] [--replay FILE]."""
import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sim.environment import SimulationEnvironment, SimulationConfig
from sim.metrics import MetricsTracker
from comms.message_bus import MessageBus

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

def parse_args():
    parser = argparse.ArgumentParser(
        description="Drone Search & Rescue Multi-Agent Simulation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python run_sim.py --scenario rescue_seeded --seed 42 --agents 4
    python run_sim.py --record replay.json --seed 42
    python run_sim.py --replay replay.json
        """
    )
    
    parser.add_argument(
        '--scenario',
        type=str,
        default='rescue_seeded',
        choices=['rescue_seeded', 'stress_test', 'minimal'],
        help='Simulation scenario to run'
    )
    
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for deterministic runs'
    )
    
    parser.add_argument(
        '--agents',
        type=int,
        default=4,
        help='Number of drone agents'
    )
    
    parser.add_argument(
        '--duration',
        type=int,
        default=180,
        help='Simulation duration in seconds'
    )
    
    parser.add_argument(
        '--grid-size',
        type=int,
        default=20,
        help='Grid size (NxN)'
    )
    
    parser.add_argument(
        '--targets',
        type=int,
        default=5,
        help='Number of targets to place'
    )
    
    parser.add_argument(
        '--record',
        type=str,
        metavar='FILE',
        help='Record simulation to JSON file for replay'
    )
    
    parser.add_argument(
        '--replay',
        type=str,
        metavar='FILE',
        help='Replay simulation from JSON file'
    )
    
    parser.add_argument(
        '--verbose',
        '-v',
        action='store_true',
        help='Enable verbose output'
    )
    
    return parser.parse_args()

async def run_simulation(config: SimulationConfig, record_file: str = None):
    import zmq.asyncio

    context = zmq.asyncio.Context()
    message_bus = MessageBus(context)
    await message_bus.start()

    metrics = MetricsTracker(
        total_targets=config.num_targets,
        total_tiles=config.grid_width * config.grid_height,
        total_agents=config.num_agents
    )

    sim = SimulationEnvironment(config, message_bus)
    sim.initialize_agents()

    if record_file:
        sim.start_recording()
        logger.info("Recording enabled - will save to %s", record_file)

    def on_message(msg):
        metrics.record_message(msg.get("type", ""))
        if msg.get("type") == "TARGET_FOUND":
            metrics.record_target_found()
    
    message_bus.on_message_callback = on_message

    def on_state_update(state):
        metrics.update(
            tick=state["state"]["tick"],
            agents=state["agents"],
            visited_count=len(state["grid"]["visited_tiles"]),
            targets_found=len(state["grid"]["target_positions"]),
            msg_stats=state["message_stats"]
        )

        if state["state"]["tick"] % 10 == 0:
            current = metrics.get_current_metrics()
            logger.info(
                "Tick %d | Coverage: %.1f%% | Targets: %d/%d | Messages: %d",
                state["state"]["tick"],
                current["coverage_percent"],
                current["targets_found"],
                current["total_targets"],
                current["total_messages"]
            )
    
    sim.on_state_update = on_state_update
    metrics.start()

    logger.info("=" * 60)
    logger.info("DRONE SEARCH & RESCUE SIMULATION")
    logger.info("=" * 60)
    logger.info("Configuration:")
    logger.info("  Grid: %dx%d", config.grid_width, config.grid_height)
    logger.info("  Agents: %d", config.num_agents)
    logger.info("  Targets: %d", config.num_targets)
    logger.info("  Duration: %ds", config.duration_seconds)
    logger.info("  Seed: %d", config.seed)
    logger.info("=" * 60)
    
    try:
        await sim.start()
    except KeyboardInterrupt:
        logger.info("Simulation interrupted by user")
        await sim.stop()

    summary = metrics.get_summary()
    logger.info("=" * 60)
    logger.info("SIMULATION COMPLETE")
    logger.info("=" * 60)
    logger.info("Final Metrics:")
    for key, value in summary.items():
        logger.info("  %s: %s", key.replace("_", " ").title(), value)
    logger.info("=" * 60)

    if record_file:
        sim.save_replay(record_file)
        logger.info("Replay saved to: %s", record_file)

    await message_bus.stop()
    context.term()
    
    return summary

async def replay_simulation(replay_file: str):
    logger.info("Loading replay from: %s", replay_file)
    
    with open(replay_file, 'r') as f:
        data = json.load(f)
    
    config = data.get("config", {})
    states = data.get("states", [])
    messages = data.get("messages", [])
    
    logger.info("=" * 60)
    logger.info("REPLAYING SIMULATION")
    logger.info("=" * 60)
    logger.info("Original Config:")
    for key, value in config.items():
        logger.info("  %s: %s", key, value)
    logger.info("States to replay: %d", len(states))
    logger.info("Messages recorded: %d", len(messages))
    logger.info("=" * 60)
    
    # Replay states with timing
    for i, state_record in enumerate(states):
        tick = state_record.get("tick", i)
        state = state_record.get("state", {})
        
        if tick % 10 == 0:
            logger.info(
                "Replay Tick %d | Coverage: %.1f%% | Targets: %d",
                tick,
                state.get("state", {}).get("coverage_percent", 0),
                len(state.get("state", {}).get("targets_found", []))
            )
        
        await asyncio.sleep(0.05)  # Fast replay
    
    logger.info("=" * 60)
    logger.info("REPLAY COMPLETE")
    logger.info("=" * 60)

def main():
    """Main entry point"""
    args = parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Handle replay mode
    if args.replay:
        asyncio.run(replay_simulation(args.replay))
        return
    
    # Create configuration based on scenario
    if args.scenario == 'stress_test':
        config = SimulationConfig(
            grid_width=30,
            grid_height=30,
            num_agents=8,
            num_targets=10,
            duration_seconds=args.duration,
            seed=args.seed
        )
    elif args.scenario == 'minimal':
        config = SimulationConfig(
            grid_width=10,
            grid_height=10,
            num_agents=2,
            num_targets=2,
            duration_seconds=min(args.duration, 60),
            seed=args.seed
        )
    else:  # rescue_seeded (default)
        config = SimulationConfig(
            grid_width=args.grid_size,
            grid_height=args.grid_size,
            num_agents=args.agents,
            num_targets=args.targets,
            duration_seconds=args.duration,
            seed=args.seed
        )

    asyncio.run(run_simulation(config, args.record))

if __name__ == "__main__":
    main()
