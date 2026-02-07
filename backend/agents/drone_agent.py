"""Autonomous SAR drone agent; A2A via ZeroMQ."""
import asyncio
import random
import time
import uuid
from dataclasses import dataclass, field
from typing import Optional, List, Set, Dict, Any, Callable, Tuple
from enum import Enum
import logging
import heapq

logger = logging.getLogger(__name__)

class DroneState(Enum):
    IDLE = "idle"
    SEARCHING = "searching"
    RETURNING = "returning"
    DEAD = "dead"

class MessageType(Enum):
    OFFER_TILE = "OFFER_TILE"
    ACCEPT_OFFER = "ACCEPT_OFFER"
    HANDOFF_REQUEST = "HANDOFF_REQUEST"
    ACCEPT_HANDOFF = "ACCEPT_HANDOFF"
    HEARTBEAT = "HEARTBEAT"
    TARGET_FOUND = "TARGET_FOUND"

@dataclass
class Position:
    x: int
    y: int
    
    def to_dict(self) -> dict:
        return {"x": self.x, "y": self.y}
    
    def distance_to(self, other: 'Position') -> float:
        return abs(self.x - other.x) + abs(self.y - other.y)

@dataclass
class Message:
    """A2A message (JSON-serializable)."""
    type: str
    agent_id: str
    timestamp: float
    payload: Dict[str, Any]
    message_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    def to_dict(self) -> dict:
        return {
            "type": self.type,
            "agent_id": self.agent_id,
            "timestamp": self.timestamp,
            "payload": self.payload,
            "message_id": self.message_id
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Message':
        return cls(
            type=data["type"],
            agent_id=data["agent_id"],
            timestamp=data["timestamp"],
            payload=data["payload"],
            message_id=data.get("message_id", str(uuid.uuid4()))
        )

class DroneAgent:
    """SAR drone: A* pathfinding, boustrophedon coverage, dynamic zones."""

    # Battery drain rates (aggressive for max speed)
    BATTERY_DRAIN_MOVE = 0.5
    BATTERY_DRAIN_IDLE = 0.1
    BATTERY_DRAIN_SCAN = 0.3
    LOW_BATTERY_THRESHOLD = 20.0
    HANDOFF_ACCEPT_THRESHOLD = 40.0
    CRITICAL_BATTERY = 5.0
    
    def __init__(
        self,
        agent_id: str,
        start_position: Position,
        grid_size: tuple,
        random_seed: int,
        send_message_callback: Callable[[Message], None],
        detection_probability: float = 0.3
    ):
        self.agent_id = agent_id
        self.position = start_position
        self.grid_size = grid_size
        self.battery = 100.0
        self.state = DroneState.IDLE
        self.rng = random.Random(random_seed + hash(agent_id))
        self.assigned_tiles: Set[tuple] = set()
        self.visited_tiles: Set[tuple] = set()
        self.pending_offers: Dict[str, tuple] = {}
        self.targets_found: List[tuple] = []
        self.inbox: List[Message] = []
        self.send_message = send_message_callback
        self.detection_probability = detection_probability
        self.last_heartbeat = 0.0
        self.heartbeat_interval = 2.0
        self.handoff_pending = False
        self.handoff_target_agent: Optional[str] = None
        
        # New attributes for improved pathfinding and coverage
        self.ordered_tiles: List[tuple] = []  # Tiles in optimal order
        self.current_path: List[tuple] = []  # Cached A* path to current target
        self.current_target: Optional[tuple] = None  # Current target tile
        self.path_cache: Dict[tuple, List[tuple]] = {}  # Cache paths to avoid recalculation
        
    def get_state(self) -> dict:
        return {
            "agent_id": self.agent_id,
            "position": self.position.to_dict(),
            "battery": round(self.battery, 1),
            "state": self.state.value,
            "assigned_tiles": len(self.assigned_tiles),
            "visited_tiles": len(self.visited_tiles),
            "targets_found": len(self.targets_found)
        }
    
    def receive_message(self, message: Message):
        if message.agent_id != self.agent_id:
            self.inbox.append(message)

    def _create_message(self, msg_type: MessageType, payload: dict) -> Message:
        return Message(
            type=msg_type.value,
            agent_id=self.agent_id,
            timestamp=time.time(),
            payload=payload
        )
    
    async def tick(self, current_time: float, target_positions: Set[tuple], other_drone_positions: Dict[str, tuple] = None) -> List[Message]:
        messages_sent = []
        if self.state == DroneState.DEAD:
            return messages_sent
        if self.battery <= self.CRITICAL_BATTERY:
            self.state = DroneState.DEAD
            return messages_sent

        # Store other drone positions for collision avoidance
        if other_drone_positions is None:
            other_drone_positions = {}
        

        # Store other drone positions for collision avoidance
        if other_drone_positions is None:
            other_drone_positions = {}
        
        await self._process_inbox()
        if current_time - self.last_heartbeat >= self.heartbeat_interval:
            heartbeat = self._create_message(
                MessageType.HEARTBEAT,
                {"position": self.position.to_dict(), "battery": self.battery}
            )
            self.send_message(heartbeat)
            messages_sent.append(heartbeat)
            self.last_heartbeat = current_time

        if self.battery < self.LOW_BATTERY_THRESHOLD and not self.handoff_pending and self.assigned_tiles:
            handoff_request = self._create_message(
                MessageType.HANDOFF_REQUEST,
                {
                    "tiles": list(self.assigned_tiles),
                    "position": self.position.to_dict(),
                    "battery": self.battery
                }
            )
            self.send_message(handoff_request)
            messages_sent.append(handoff_request)
            self.handoff_pending = True

        if self.state == DroneState.IDLE:
            if not self.assigned_tiles:
                self.state = DroneState.IDLE
            else:
                self.state = DroneState.SEARCHING

        elif self.state == DroneState.SEARCHING:
            target_tile = self._get_nearest_unvisited_tile()
            if target_tile:
                moved = await self._move_towards(target_tile, other_drone_positions)
                moved = await self._move_towards(target_tile, other_drone_positions)
                if moved:
                    self.battery -= self.BATTERY_DRAIN_MOVE
                current_pos = (self.position.x, self.position.y)
                if current_pos == target_tile:
                    self.visited_tiles.add(current_pos)
                    self.battery -= self.BATTERY_DRAIN_SCAN
                    
                    # Use CNN model for person detection on every tile scan
                    try:
                        from models.person_detector import detect_person

                        detection_result = detect_person(
                            current_pos, simulate=True, target_positions=target_positions
                        )
                        
                        if detection_result["person_detected"]:
                            # CNN detected a person
                            confidence = detection_result["confidence"]
                            
                            # Only report if we haven't found this target yet
                            if current_pos not in self.targets_found:
                                self.targets_found.append(current_pos)
                                target_msg = self._create_message(
                                    MessageType.TARGET_FOUND,
                                    {
                                        "position": {"x": current_pos[0], "y": current_pos[1]},
                                        "detection_method": "cnn",
                                        "confidence": confidence,
                                        "detections": detection_result["detections"]
                                    }
                                )
                                self.send_message(target_msg)
                                messages_sent.append(target_msg)
                                logger.info(f"{self.agent_id}: CNN detected person at {current_pos} (confidence: {confidence})")
                        
                    except Exception as e:
                        logger.error(f"CNN detection error at {current_pos}: {e}")
                        # Fallback to probability-based detection
                        if current_pos in target_positions:
                            if self.rng.random() < self.detection_probability:
                                if current_pos not in self.targets_found:
                                    self.targets_found.append(current_pos)
                                    target_msg = self._create_message(
                                        MessageType.TARGET_FOUND,
                                        {
                                            "position": {"x": current_pos[0], "y": current_pos[1]},
                                            "detection_method": "probability_fallback"
                                        }
                                    )
                                    self.send_message(target_msg)
                                    messages_sent.append(target_msg)
            else:
                self.state = DroneState.IDLE
                self.battery -= self.BATTERY_DRAIN_IDLE

        if len(self.assigned_tiles) > 10 and self.rng.random() < 0.1:
            tiles_to_offer = list(self.assigned_tiles)[:3]
            offer = self._create_message(
                MessageType.OFFER_TILE,
                {"tiles": [{"x": t[0], "y": t[1]} for t in tiles_to_offer]}
            )
            for t in tiles_to_offer:
                self.pending_offers[offer.message_id] = t
            self.send_message(offer)
            messages_sent.append(offer)
        
        return messages_sent

    async def _process_inbox(self):
        while self.inbox:
            message = self.inbox.pop(0)
            await self._handle_message(message)

    async def _handle_message(self, message: Message):
        msg_type = message.type
        if msg_type == MessageType.OFFER_TILE.value:
            if self.battery > self.HANDOFF_ACCEPT_THRESHOLD:
                tiles = message.payload.get("tiles", [])
                accept_msg = self._create_message(
                    MessageType.ACCEPT_OFFER,
                    {
                        "original_message_id": message.message_id,
                        "accepted_tiles": tiles
                    }
                )
                for tile in tiles:
                    self.assigned_tiles.add((tile["x"], tile["y"]))
                self.send_message(accept_msg)

        elif msg_type == MessageType.ACCEPT_OFFER.value:
            original_id = message.payload.get("original_message_id")
            accepted = message.payload.get("accepted_tiles", [])
            for tile in accepted:
                t = (tile["x"], tile["y"])
                self.assigned_tiles.discard(t)
                self.pending_offers.pop(original_id, None)

        elif msg_type == MessageType.HANDOFF_REQUEST.value:
            if self.battery > self.HANDOFF_ACCEPT_THRESHOLD and not self.handoff_pending:
                tiles = message.payload.get("tiles", [])
                tiles_to_accept = tiles[:min(len(tiles), 10)]
                accept_msg = self._create_message(
                    MessageType.ACCEPT_HANDOFF,
                    {
                        "from_agent": message.agent_id,
                        "accepted_tiles": tiles_to_accept
                    }
                )
                for tile in tiles_to_accept:
                    self.assigned_tiles.add((tile[0], tile[1]) if isinstance(tile, (list, tuple)) else (tile["x"], tile["y"]))
                self.send_message(accept_msg)

        elif msg_type == MessageType.ACCEPT_HANDOFF.value:
            if message.payload.get("from_agent") == self.agent_id or self.handoff_pending:
                accepted = message.payload.get("accepted_tiles", [])
                for tile in accepted:
                    if isinstance(tile, (list, tuple)):
                        self.assigned_tiles.discard((tile[0], tile[1]))
                    else:
                        self.assigned_tiles.discard((tile.get("x"), tile.get("y")))
                self.handoff_pending = False

        elif msg_type == MessageType.HEARTBEAT.value:
            pass

    def _get_nearest_unvisited_tile(self) -> Optional[tuple]:
        """Get next tile using ordered list or nearest-first fallback."""
        unvisited = self.assigned_tiles - self.visited_tiles
        if not unvisited:
            return None
        
        # Use ordered tiles if available (boustrophedon pattern)
        if self.ordered_tiles:
            for tile in self.ordered_tiles:
                if tile in unvisited:
                    return tile
        
        # Fallback to nearest tile
        current = (self.position.x, self.position.y)
        return min(unvisited, key=lambda t: abs(t[0] - current[0]) + abs(t[1] - current[1]))
    
    def _astar_pathfind(
        self, 
        start: Tuple[int, int], 
        goal: Tuple[int, int],
        occupied_positions: Set[Tuple[int, int]] = None
    ) -> List[Tuple[int, int]]:
        """
        A* pathfinding algorithm for optimal path from start to goal.
        Returns list of positions from start to goal (excluding start).
        """
        if occupied_positions is None:
            occupied_positions = set()
        
        def heuristic(pos: Tuple[int, int]) -> int:
            # Manhattan distance
            return abs(pos[0] - goal[0]) + abs(pos[1] - goal[1])
        
        def get_neighbors(pos: Tuple[int, int]) -> List[Tuple[int, int]]:
            neighbors = []
            for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:  # 4-directional
                new_pos = (pos[0] + dx, pos[1] + dy)
                if self._is_valid_position(new_pos) and new_pos not in occupied_positions:
                    neighbors.append(new_pos)
            return neighbors
        
        # Priority queue: (f_score, counter, position, path)
        counter = 0
        open_set = [(heuristic(start), counter, start, [])]
        closed_set = set()
        
        while open_set:
            f_score, _, current, path = heapq.heappop(open_set)
            
            if current == goal:
                return path + [current]
            
            if current in closed_set:
                continue
            
            closed_set.add(current)
            
            for neighbor in get_neighbors(current):
                if neighbor not in closed_set:
                    new_path = path + [current] if current != start else []
                    g_score = len(new_path) + 1
                    h_score = heuristic(neighbor)
                    f_score = g_score + h_score
                    
                    counter += 1
                    heapq.heappush(open_set, (f_score, counter, neighbor, new_path + [neighbor]))
        
        # No path found, return empty
        return []

    async def _move_towards(self, target: tuple, other_drone_positions: Dict[str, tuple] = None) -> bool:
        """
        Move towards target using A* pathfinding with collision avoidance.
        For max speed: aggressive movement, cache paths, handle collisions efficiently.
        """
        if other_drone_positions is None:
            other_drone_positions = {}
        
        current_pos = (self.position.x, self.position.y)
        
        if current_pos == target:
            return False
        
        # Get occupied positions (excluding self)
        occupied = set()
        for agent_id, pos in other_drone_positions.items():
            if agent_id != self.agent_id:
                occupied.add(pos)
        
        # Check if we have a cached path and if it's still valid
        if self.current_target == target and self.current_path:
            # Check if next step in path is not blocked
            if self.current_path and self.current_path[0] not in occupied:
                next_pos = self.current_path.pop(0)
                self.position.x = next_pos[0]
                self.position.y = next_pos[1]
                return True
            else:
                # Path blocked, recalculate
                self.current_path = []
        
        # Calculate new path using A*
        if self.current_target != target or not self.current_path:
            self.current_target = target
            path = self._astar_pathfind(current_pos, target, occupied)
            
            if path:
                self.current_path = path[1:] if path[0] == current_pos else path
            else:
                # No path found, try simple movement
                self.current_path = []
        
        # Execute next move from path
        if self.current_path:
            next_pos = self.current_path.pop(0)
            if next_pos not in occupied and self._is_valid_position(next_pos):
                self.position.x = next_pos[0]
                self.position.y = next_pos[1]
                return True
        
        # Fallback: try direct movement (aggressive mode)
        dx = target[0] - self.position.x
        dy = target[1] - self.position.y
        
        next_x = self.position.x
        next_y = self.position.y
        
        if abs(dx) >= abs(dy):
            next_x += 1 if dx > 0 else -1
            next_x += 1 if dx > 0 else -1
        else:
            next_y += 1 if dy > 0 else -1
        
        primary_move = (next_x, next_y)
        
        if primary_move not in occupied and self._is_valid_position(primary_move):
            self.position.x = next_x
            self.position.y = next_y
            self.current_path = []  # Clear path since we deviated
            return True
        
        # Try alternative directions
        alternative_moves = []
        
        if abs(dx) >= abs(dy) and dy != 0:
            alt_y = self.position.y + (1 if dy > 0 else -1)
            alternative_moves.append((self.position.x, alt_y))
        elif abs(dy) > abs(dx) and dx != 0:
            alt_x = self.position.x + (1 if dx > 0 else -1)
            alternative_moves.append((alt_x, self.position.y))
        
        for alt_pos in alternative_moves:
            if alt_pos not in occupied and self._is_valid_position(alt_pos):
                self.position.x = alt_pos[0]
                self.position.y = alt_pos[1]
                self.current_path = []  # Clear path since we deviated
                return True
        
        # All moves blocked, stay in place (rare in max speed mode)
        return False
    
    def _is_valid_position(self, pos: tuple) -> bool:
        """Check if position is within grid bounds."""
        x, y = pos
        return 0 <= x < self.grid_size[0] and 0 <= y < self.grid_size[1]

    def assign_tiles(self, tiles: List[tuple], ordered: bool = False):
        """
        Assign tiles to this drone.
        If ordered=True, tiles are already in optimal order (boustrophedon).
        """
        if ordered:
            self.ordered_tiles = list(tiles)
            self.assigned_tiles = set(tiles)
        else:
            self.assigned_tiles.update(tiles)
            self.ordered_tiles = []  # Will use nearest-first fallback
        
        if self.state == DroneState.IDLE and self.assigned_tiles:
            self.state = DroneState.SEARCHING
    
    def reassign_tiles(self, new_tiles: List[tuple], ordered: bool = False):
        """
        Reassign tiles (for dynamic zone reallocation).
        Clears previous assignment and assigns new tiles.
        """
        self.assigned_tiles.clear()
        self.ordered_tiles.clear()
        self.current_path.clear()
        self.current_target = None
        self.assign_tiles(new_tiles, ordered=ordered)
        logger.info("%s: Reassigned %d tiles", self.agent_id, len(new_tiles))
