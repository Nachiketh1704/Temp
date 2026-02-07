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
from agents.ground_agent import GroundAgent
from sim.zone_allocator import ZoneAllocator

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
        self.ground_agent: Optional[GroundAgent] = None 
        self.all_tiles: Set[tuple] = set()
        self.assigned_tiles: Set[tuple] = set()
        self.visited_tiles: Set[tuple] = set()
        self.state = SimulationState()
        self.start_time: Optional[float] = None
        self.recording = False
        self.replay_log: List[dict] = []
        self.on_state_update: Optional[Callable[[dict], None]] = None
        
        # Zone allocator for dynamic zone assignment
        self.zone_allocator = ZoneAllocator(self.grid_width, self.grid_height)
        self.ticks_since_reallocation = 0
        self.use_dynamic_zones = True  # Enable dynamic zone reallocation
        
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
    
    def _initialize_ground_agent(self):
        """Initialize the ground agent (master coordinator)."""
        def send_message(msg: Message):
            asyncio.create_task(self.message_bus.publish(msg.to_dict()))
        
        self.ground_agent = GroundAgent(
            agent_id="GROUND-CONTROL",
            grid_size=(self.grid_width, self.grid_height),
            send_message_callback=send_message
        )
        
        def handle_ground_message(msg_dict: dict):
            msg = Message.from_dict(msg_dict)
            self.ground_agent.receive_message(msg)
        
        self.message_bus.register_handler("GROUND-CONTROL", handle_ground_message)
        logger.info("Ground Agent initialized for %dx%d grid", self.grid_width, self.grid_height)
    
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

        # Initialize Ground Agent
        self._initialize_ground_agent()

        self._distribute_tiles()

    def _distribute_tiles(self):
        """Initial tile distribution using zone allocation."""
        tiles_list = list(self.all_tiles)
        
        # Get drone positions and batteries
        drone_positions = {
            agent_id: (agent.position.x, agent.position.y)
            for agent_id, agent in self.agents.items()
        }
        drone_batteries = {
            agent_id: agent.battery
            for agent_id, agent in self.agents.items()
        }
        
        # Use Voronoi-based allocation for initial distribution
        allocation = self.zone_allocator.allocate_zones_voronoi(
            drone_positions,
            set(tiles_list),
            drone_batteries
        )
        
        # Optimize tile order for boustrophedon pattern
        allocation = self.zone_allocator.optimize_for_speed(allocation, drone_positions)
        
        # Assign tiles to agents
        for agent_id, tiles in allocation.items():
            if agent_id in self.agents:
                self.agents[agent_id].assign_tiles(tiles, ordered=True)
                self.assigned_tiles.update(tiles)
                logger.info("Assigned %d tiles to %s (ordered)", len(tiles), agent_id)
    
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
            
            # Collect all drone positions for collision avoidance
            drone_positions = {
                agent_id: (agent.position.x, agent.position.y)
                for agent_id, agent in self.agents.items()
            }
            
            # Tick all drone agents
            for agent in self.agents.values():
                await agent.tick(current_time, self.target_positions, drone_positions)
            
            # Tick ground agent
            if self.ground_agent:
                full_state = self.get_full_state()
                await self.ground_agent.tick(current_time, full_state)
                
                # Update ground agent with latest drone states
                for agent in self.agents.values():
                    self.ground_agent.update_drone_state(
                        agent.agent_id,
                        agent.get_state()
                    )
            
            # Dynamic zone reallocation (Phase 3)
            if self.use_dynamic_zones:
                await self._check_and_reallocate_zones()

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
        state_dict = {
            "config": self.config.to_dict(),
            "state": self.state.to_dict(),
            "agents": [agent.get_state() for agent in self.agents.values()],
            "grid": {
                "width": self.grid_width,
                "height": self.grid_height,
                "visited_tiles": [{"x": t[0], "y": t[1]} for t in self.visited_tiles],
                "target_positions": [{"x": t[0], "y": t[1]} for t in self.discovered_targets],
                "all_targets": [{"x": t[0], "y": t[1]} for t in self.target_positions]
            },
            "message_stats": self.message_bus.get_stats()
        }
        
        # Add ground agent state if available
        if self.ground_agent:
            state_dict["ground_agent"] = self.ground_agent.get_state()
        
        return state_dict
    
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
    
    async def _check_and_reallocate_zones(self):
        """
        Check if zones should be reallocated and perform reallocation if needed.
        This is Phase 3: Dynamic Zone Assignment.
        """
        self.ticks_since_reallocation += 1
        
        # Get current allocation
        current_allocation = {
            agent_id: list(agent.assigned_tiles - agent.visited_tiles)
            for agent_id, agent in self.agents.items()
        }
        
        # Get drone positions and batteries
        drone_positions = {
            agent_id: (agent.position.x, agent.position.y)
            for agent_id, agent in self.agents.items()
        }
        drone_batteries = {
            agent_id: agent.battery
            for agent_id, agent in self.agents.items()
        }
        
        # Check if reallocation is needed
        should_reallocate = self.zone_allocator.should_reallocate(
            current_allocation,
            drone_positions,
            drone_batteries,
            self.ticks_since_reallocation,
            min_realloc_interval=20  # Aggressive: reallocate every 20 ticks minimum
        )
        
        if should_reallocate:
            # Get all unvisited tiles
            unvisited_tiles = self.all_tiles - self.visited_tiles
            
            if len(unvisited_tiles) > 0:
                # Reallocate using Voronoi
                new_allocation = self.zone_allocator.allocate_zones_voronoi(
                    drone_positions,
                    unvisited_tiles,
                    drone_batteries
                )
                
                # Optimize for speed (boustrophedon pattern)
                new_allocation = self.zone_allocator.optimize_for_speed(
                    new_allocation,
                    drone_positions
                )
                
                # Reassign tiles to agents
                for agent_id, tiles in new_allocation.items():
                    if agent_id in self.agents and len(tiles) > 0:
                        self.agents[agent_id].reassign_tiles(tiles, ordered=True)
                
                logger.info(
                    "Zone reallocation completed at tick %d. New allocation: %s",
                    self.state.tick,
                    {agent_id: len(tiles) for agent_id, tiles in new_allocation.items()}
                )
                
                self.ticks_since_reallocation = 0
