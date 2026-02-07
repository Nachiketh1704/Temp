"""Ground Agent - Master coordinator for all drone agents with full command & control."""
import asyncio
import time
import uuid
import logging
from typing import Dict, List, Set, Optional, Callable, Any
from dataclasses import dataclass, field
from enum import Enum

from agents.drone_agent import Message, Position

logger = logging.getLogger(__name__)

class GroundAgentState(Enum):
    IDLE = "idle"
    MONITORING = "monitoring"
    COORDINATING = "coordinating"
    EMERGENCY = "emergency"

class CommandType(Enum):
    ASSIGN_TILES = "ASSIGN_TILES"
    RECALL_DRONE = "RECALL_DRONE"
    PRIORITY_AREA = "PRIORITY_AREA"
    BATTERY_WARNING = "BATTERY_WARNING"
    REPOSITION = "REPOSITION"
    STATUS_REQUEST = "STATUS_REQUEST"

@dataclass
class DroneStatus:
    """Tracked status for each drone."""
    agent_id: str
    position: Dict[str, int]
    battery: float
    state: str
    assigned_tiles: int
    visited_tiles: int
    targets_found: int
    last_heartbeat: float
    is_active: bool = True
    
    def to_dict(self) -> dict:
        return {
            "agent_id": self.agent_id,
            "position": self.position,
            "battery": round(self.battery, 1),
            "state": self.state,
            "assigned_tiles": self.assigned_tiles,
            "visited_tiles": self.visited_tiles,
            "targets_found": self.targets_found,
            "last_heartbeat": self.last_heartbeat,
            "is_active": self.is_active
        }

@dataclass
class GroundCommand:
    """Command sent from ground agent to drones."""
    command_type: str
    target_agent_id: Optional[str]
    payload: Dict[str, Any]
    command_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = field(default_factory=time.time)
    
    def to_dict(self) -> dict:
        return {
            "command_type": self.command_type,
            "target_agent_id": self.target_agent_id,
            "payload": self.payload,
            "command_id": self.command_id,
            "timestamp": self.timestamp
        }

class GroundAgent:
    """Master coordinator with full command & control over all drones."""
    
    HEARTBEAT_TIMEOUT = 10.0  # Consider drone inactive after 10s without heartbeat
    LOW_BATTERY_THRESHOLD = 25.0
    CRITICAL_BATTERY_THRESHOLD = 15.0
    COORDINATION_INTERVAL = 5.0  # Run coordination logic every 5 seconds
    
    def __init__(
        self,
        agent_id: str,
        grid_size: tuple,
        send_message_callback: Callable[[Message], None]
    ):
        self.agent_id = agent_id
        self.grid_size = grid_size
        self.state = GroundAgentState.MONITORING
        self.send_message = send_message_callback
        
        # Tracking
        self.drone_status: Dict[str, DroneStatus] = {}
        self.discovered_targets: Set[tuple] = set()
        self.coverage_map: Set[tuple] = set()
        self.priority_areas: List[tuple] = []
        
        # Command tracking
        self.commands_sent: List[GroundCommand] = []
        self.messages_received: List[Message] = []
        
        # Statistics
        self.stats = {
            "total_commands_sent": 0,
            "total_messages_received": 0,
            "targets_found": 0,
            "active_drones": 0,
            "coverage_percent": 0.0,
            "coordination_cycles": 0
        }
        
        self.last_coordination_time = 0.0
        self.start_time = time.time()
        
        logger.info("Ground Agent %s initialized for %dx%d grid", 
                   agent_id, grid_size[0], grid_size[1])
    
    def get_state(self) -> dict:
        """Get current ground agent state."""
        return {
            "agent_id": self.agent_id,
            "state": self.state.value,
            "drone_status": {
                drone_id: status.to_dict() 
                for drone_id, status in self.drone_status.items()
            },
            "discovered_targets": [
                {"x": t[0], "y": t[1]} for t in self.discovered_targets
            ],
            "coverage_tiles": len(self.coverage_map),
            "priority_areas": [
                {"x": t[0], "y": t[1]} for t in self.priority_areas
            ],
            "stats": self.stats,
            "uptime": round(time.time() - self.start_time, 1)
        }
    
    def receive_message(self, message: Message):
        """Receive and process messages from drones."""
        self.messages_received.append(message)
        self.stats["total_messages_received"] += 1
        
        msg_type = message.type
        agent_id = message.agent_id
        payload = message.payload
        
        # Update drone status based on message type
        if msg_type == "HEARTBEAT":
            self._handle_heartbeat(agent_id, payload)
        
        elif msg_type == "TARGET_FOUND":
            self._handle_target_found(agent_id, payload)
        
        elif msg_type == "HANDOFF_REQUEST":
            self._handle_handoff_request(agent_id, payload)
        
        elif msg_type == "OFFER_TILE":
            self._handle_tile_offer(agent_id, payload)
    
    def _handle_heartbeat(self, agent_id: str, payload: dict):
        """Process heartbeat from drone."""
        position = payload.get("position", {})
        battery = payload.get("battery", 0)
        
        if agent_id in self.drone_status:
            status = self.drone_status[agent_id]
            status.position = position
            status.battery = battery
            status.last_heartbeat = time.time()
            status.is_active = True
        else:
            # First heartbeat from new drone
            self.drone_status[agent_id] = DroneStatus(
                agent_id=agent_id,
                position=position,
                battery=battery,
                state="searching",
                assigned_tiles=0,
                visited_tiles=0,
                targets_found=0,
                last_heartbeat=time.time()
            )
        
        # Check for low battery
        if battery < self.CRITICAL_BATTERY_THRESHOLD:
            self._send_command(
                CommandType.BATTERY_WARNING,
                agent_id,
                {"level": "critical", "action": "recall"}
            )
        elif battery < self.LOW_BATTERY_THRESHOLD:
            self._send_command(
                CommandType.BATTERY_WARNING,
                agent_id,
                {"level": "low", "action": "coordinate_handoff"}
            )
    
    def _handle_target_found(self, agent_id: str, payload: dict):
        """Process target found notification."""
        position = payload.get("position", {})
        target_pos = (position.get("x"), position.get("y"))
        
        if target_pos not in self.discovered_targets:
            self.discovered_targets.add(target_pos)
            self.stats["targets_found"] += 1
            
            if agent_id in self.drone_status:
                self.drone_status[agent_id].targets_found += 1
            
            logger.info("Ground Agent: Target found by %s at %s (Total: %d)", 
                       agent_id, target_pos, self.stats["targets_found"])
    
    def _handle_handoff_request(self, agent_id: str, payload: dict):
        """Coordinate handoff from low-battery drone."""
        tiles = payload.get("tiles", [])
        battery = payload.get("battery", 0)
        
        # Find best drone to take over tiles
        best_drone = self._find_best_drone_for_handoff(agent_id, tiles)
        
        if best_drone:
            self._send_command(
                CommandType.ASSIGN_TILES,
                best_drone,
                {
                    "tiles": tiles[:len(tiles)//2],  # Assign half the tiles
                    "priority": "high",
                    "from_agent": agent_id
                }
            )
            logger.info("Ground Agent: Coordinating handoff from %s to %s", 
                       agent_id, best_drone)
    
    def _handle_tile_offer(self, agent_id: str, payload: dict):
        """Monitor tile offers between drones."""
        # Ground agent monitors but doesn't interfere unless needed
        pass
    
    def _find_best_drone_for_handoff(self, requesting_agent: str, tiles: List) -> Optional[str]:
        """Find best drone to take over tiles from low-battery drone."""
        best_drone = None
        best_score = -1
        
        for drone_id, status in self.drone_status.items():
            if drone_id == requesting_agent or not status.is_active:
                continue
            
            # Score based on battery and workload
            score = status.battery - (status.assigned_tiles * 0.5)
            
            if score > best_score and status.battery > 40:
                best_score = score
                best_drone = drone_id
        
        return best_drone
    
    def _send_command(self, command_type: CommandType, target_agent: str, payload: dict):
        """Send command to specific drone or broadcast."""
        command = GroundCommand(
            command_type=command_type.value,
            target_agent_id=target_agent,
            payload=payload
        )
        
        message = Message(
            type="GROUND_COMMAND",
            agent_id=self.agent_id,
            timestamp=time.time(),
            payload={
                "command": command.to_dict(),
                "target": target_agent
            }
        )
        
        self.send_message(message)
        self.commands_sent.append(command)
        self.stats["total_commands_sent"] += 1
    
    async def tick(self, current_time: float, simulation_state: dict):
        """Main coordination loop - runs every tick."""
        # Update active drone count
        self._update_drone_statuses(current_time)
        
        # Run strategic coordination periodically
        if current_time - self.last_coordination_time >= self.COORDINATION_INTERVAL:
            await self._coordinate_strategy(simulation_state)
            self.last_coordination_time = current_time
            self.stats["coordination_cycles"] += 1
    
    def _update_drone_statuses(self, current_time: float):
        """Update drone status and check for timeouts."""
        active_count = 0
        total_coverage = set()
        
        for drone_id, status in self.drone_status.items():
            # Check heartbeat timeout
            if current_time - status.last_heartbeat > self.HEARTBEAT_TIMEOUT:
                if status.is_active:
                    status.is_active = False
                    logger.warning("Ground Agent: Drone %s is no longer responding", drone_id)
            else:
                active_count += 1
        
        self.stats["active_drones"] = active_count
    
    async def _coordinate_strategy(self, simulation_state: dict):
        """Strategic coordination logic - full command & control."""
        agents = simulation_state.get("agents", [])
        grid = simulation_state.get("grid", {})
        
        # Update coverage
        visited = grid.get("visited_tiles", [])
        self.coverage_map = {(t["x"], t["y"]) for t in visited}
        
        grid_size = grid.get("width", self.grid_size[0]) * grid.get("height", self.grid_size[1])
        if grid_size > 0:
            self.stats["coverage_percent"] = (len(self.coverage_map) / grid_size) * 100
        
        # Update drone status from simulation state
        for agent in agents:
            agent_id = agent.get("agent_id")
            if agent_id in self.drone_status:
                status = self.drone_status[agent_id]
                status.assigned_tiles = agent.get("assigned_tiles", 0)
                status.visited_tiles = agent.get("visited_tiles", 0)
                status.state = agent.get("state", "idle")
        
        # Strategic decisions
        await self._optimize_drone_deployment()
        await self._handle_idle_drones()
        await self._coordinate_low_battery_drones()
    
    async def _optimize_drone_deployment(self):
        """Optimize drone positions and assignments."""
        # Find underutilized drones and redirect
        for drone_id, status in self.drone_status.items():
            if not status.is_active:
                continue
            
            # If drone has very few tiles and good battery, could reassign
            if status.assigned_tiles < 5 and status.battery > 60:
                # This drone could help others
                pass
    
    async def _handle_idle_drones(self):
        """Assign work to idle drones."""
        for drone_id, status in self.drone_status.items():
            if status.state == "idle" and status.battery > 30 and status.is_active:
                # Could assign new tiles or priority areas
                logger.info("Ground Agent: Detected idle drone %s with %.1f%% battery", 
                          drone_id, status.battery)
    
    async def _coordinate_low_battery_drones(self):
        """Proactively coordinate low battery situations."""
        low_battery_drones = [
            (drone_id, status) 
            for drone_id, status in self.drone_status.items()
            if status.battery < self.LOW_BATTERY_THRESHOLD and status.is_active
        ]
        
        if low_battery_drones:
            logger.info("Ground Agent: Monitoring %d low-battery drones", 
                       len(low_battery_drones))
    
    def update_drone_state(self, agent_id: str, agent_data: dict):
        """Update drone status from simulation."""
        if agent_id not in self.drone_status:
            self.drone_status[agent_id] = DroneStatus(
                agent_id=agent_id,
                position=agent_data.get("position", {"x": 0, "y": 0}),
                battery=agent_data.get("battery", 100),
                state=agent_data.get("state", "idle"),
                assigned_tiles=agent_data.get("assigned_tiles", 0),
                visited_tiles=agent_data.get("visited_tiles", 0),
                targets_found=agent_data.get("targets_found", 0),
                last_heartbeat=time.time()
            )
        else:
            status = self.drone_status[agent_id]
            status.position = agent_data.get("position", status.position)
            status.battery = agent_data.get("battery", status.battery)
            status.state = agent_data.get("state", status.state)
            status.assigned_tiles = agent_data.get("assigned_tiles", status.assigned_tiles)
            status.visited_tiles = agent_data.get("visited_tiles", status.visited_tiles)
            status.targets_found = agent_data.get("targets_found", status.targets_found)
