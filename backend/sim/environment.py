"""2D grid simulation with targets and drone agents."""
import asyncio
import random
import time
import json
import logging
from typing import List, Set, Dict, Optional, Any, Callable
from dataclasses import dataclass, field
from pathlib import Path

from agents.drone_agent import DroneAgent, Position, Message, DroneState

logger = logging.getLogger(__name__)

@dataclass
class SimulationConfig:
    """Simulation config."""
    grid_width: int = 15
    grid_height: int = 15
    num_agents: int = 4
    num_targets: int = 5
    duration_seconds: int = 180
    seed: int = 42
    tick_interval: float = 0.5
    detection_probability: float = 0.7
    
    def to_dict(self) -> dict:
        return {
            "grid_width": self.grid_width,
            "grid_height": self.grid_height,
            "num_agents": self.num_agents,
            "num_targets": self.num_targets,
            "duration_seconds": self.duration_seconds,
            "seed": self.seed,
            "tick_interval": self.tick_interval,
            "detection_probability": self.detection_probability
        }

@dataclass
class SimulationState:
    """Current simulation state."""
    tick: int = 0
    elapsed_time: float = 0.0
    is_running: bool = False
    is_paused: bool = False
    targets_found: List[tuple] = field(default_factory=list)
    coverage_percent: float = 0.0
    
    def to_dict(self) -> dict:
        return {
            "tick": self.tick,
            "elapsed_time": round(self.elapsed_time, 2),
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "targets_found": [{"x": t[0], "y": t[1]} for t in self.targets_found],
            "coverage_percent": round(self.coverage_percent, 1)
        }

class SimulationEnvironment:
    """Grid, targets, agents, tile distribution, time."""

    def __init__(self, config: SimulationConfig, message_bus):
        self.config = config
        self.message_bus = message_bus

        self.rng = random.Random(config.seed)
        self.grid_width = config.grid_width
        self.grid_height = config.grid_height
        self.total_tiles = self.grid_width * self.grid_height
        self.target_positions: Set[tuple] = set()
        self.discovered_targets: Set[tuple] = set()
        self.agents: Dict[str, DroneAgent] = {}
        self.all_tiles: Set[tuple] = set()
        self.assigned_tiles: Set[tuple] = set()
        self.visited_tiles: Set[tuple] = set()
        self.state = SimulationState()
        self.start_time: Optional[float] = None
        self.recording = False
        self.replay_log: List[dict] = []
        self.on_state_update: Optional[Callable[[dict], None]] = None
        self._initialize_grid()
        self._place_targets()
    
    def _initialize_grid(self):
        for x in range(self.grid_width):
            for y in range(self.grid_height):
                self.all_tiles.add((x, y))
    
    def _place_targets(self):
        available = list(self.all_tiles)
        self.rng.shuffle(available)
        self.target_positions = set(available[:self.config.num_targets])
        logger.info("Placed %d targets at positions: %s", 
                   len(self.target_positions), self.target_positions)
    
    def _create_agent(self, agent_id: str, start_pos: Position) -> DroneAgent:
        def send_message(msg: Message):
            asyncio.create_task(self.message_bus.publish(msg.to_dict()))
        
        agent = DroneAgent(
            agent_id=agent_id,
            start_position=start_pos,
            grid_size=(self.grid_width, self.grid_height),
            random_seed=self.config.seed,
            send_message_callback=send_message,
            detection_probability=self.config.detection_probability
        )

        def handle_message(msg_dict: dict):
            msg = Message.from_dict(msg_dict)
            agent.receive_message(msg)
        
        self.message_bus.register_handler(agent_id, handle_message)
        
        return agent
    
    def initialize_agents(self):
        for agent_id in list(self.agents.keys()):
            self.message_bus.unregister_handler(agent_id)
        self.agents.clear()

        start_positions = [
            Position(0, 0),
            Position(self.grid_width - 1, 0),
            Position(0, self.grid_height - 1),
            Position(self.grid_width - 1, self.grid_height - 1),
            Position(self.grid_width // 2, 0),
            Position(0, self.grid_height // 2),
            Position(self.grid_width - 1, self.grid_height // 2),
            Position(self.grid_width // 2, self.grid_height - 1),
        ]
        
        self.rng.shuffle(start_positions)
        
        for i in range(self.config.num_agents):
            agent_id = f"DRONE-{i+1:02d}"
            pos = start_positions[i % len(start_positions)]
            agent = self._create_agent(agent_id, Position(pos.x, pos.y))
            self.agents[agent_id] = agent
            logger.info("Created agent %s at position (%d, %d)", agent_id, pos.x, pos.y)

        self._distribute_tiles()

    def _distribute_tiles(self):
        tiles_list = list(self.all_tiles)
        self.rng.shuffle(tiles_list)
        
        agent_list = list(self.agents.values())
        tiles_per_agent = len(tiles_list) // len(agent_list)
        
        for i, agent in enumerate(agent_list):
            start_idx = i * tiles_per_agent
            end_idx = start_idx + tiles_per_agent if i < len(agent_list) - 1 else len(tiles_list)
            agent_tiles = tiles_list[start_idx:end_idx]
            agent.assign_tiles(agent_tiles)
            self.assigned_tiles.update(agent_tiles)
            logger.info("Assigned %d tiles to %s", len(agent_tiles), agent.agent_id)
    
    async def start(self):
        if self.state.is_running:
            return
        
        self.state.is_running = True
        self.state.is_paused = False
        self.start_time = time.time()
        self.state.tick = 0
        
        if self.recording:
            self.message_bus.start_recording()
        
        logger.info("Simulation started")

        while self.state.is_running:
            if self.state.is_paused:
                await asyncio.sleep(0.1)
                continue

            self.state.elapsed_time = time.time() - self.start_time
            if self.state.elapsed_time >= self.config.duration_seconds:
                await self.stop()
                break

            current_time = self.state.elapsed_time
            for agent in self.agents.values():
                await agent.tick(current_time, self.target_positions)

            self._update_state()
            if self.on_state_update:
                self.on_state_update(self.get_full_state())

            if self.recording:
                self.replay_log.append({
                    "tick": self.state.tick,
                    "timestamp": current_time,
                    "state": self.get_full_state()
                })

            self.state.tick += 1
            await asyncio.sleep(self.config.tick_interval)
    
    def _update_state(self):
        self.visited_tiles.clear()
        all_targets_found = set()
        
        for agent in self.agents.values():
            self.visited_tiles.update(agent.visited_tiles)
            for target in agent.targets_found:
                all_targets_found.add(target)

        self.state.coverage_percent = (len(self.visited_tiles) / self.total_tiles) * 100
        self.discovered_targets = all_targets_found
        self.state.targets_found = list(all_targets_found)
    
    async def stop(self):
        self.state.is_running = False
        
        if self.recording:
            self.message_bus.stop_recording()
        
        logger.info("Simulation stopped after %.1f seconds", self.state.elapsed_time)
    
    def pause(self):
        self.state.is_paused = True
        logger.info("Simulation paused")
    
    def resume(self):
        self.state.is_paused = False
        logger.info("Simulation resumed")
    
    def reset(self):
        self.state = SimulationState()
        self.discovered_targets.clear()
        self.visited_tiles.clear()
        self.replay_log.clear()
        self.rng = random.Random(self.config.seed)
        self._initialize_grid()
        self._place_targets()
        self.initialize_agents()
        
        logger.info("Simulation reset")
    
    def get_full_state(self) -> dict:
        """Full state for API/dashboard."""
        return {
            "config": self.config.to_dict(),
            "state": self.state.to_dict(),
            "agents": [agent.get_state() for agent in self.agents.values()],
            "grid": {
                "width": self.grid_width,
                "height": self.grid_height,
                "visited_tiles": [{"x": t[0], "y": t[1]} for t in self.visited_tiles],
                "target_positions": [{"x": t[0], "y": t[1]} for t in self.discovered_targets]
            },
            "message_stats": self.message_bus.get_stats()
        }
    
    def start_recording(self, filename: Optional[str] = None):
        self.recording = True
        self.replay_log.clear()
        logger.info("Recording started")
    
    def stop_recording(self) -> List[dict]:
        self.recording = False
        return self.replay_log.copy()
    
    def save_replay(self, filepath: str):
        data = {
            "config": self.config.to_dict(),
            "messages": self.message_bus.get_message_log(),
            "states": self.replay_log
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info("Replay saved to %s", filepath)
    
    @classmethod
    def load_replay(cls, filepath: str) -> dict:
        with open(filepath, 'r') as f:
            return json.load(f)
