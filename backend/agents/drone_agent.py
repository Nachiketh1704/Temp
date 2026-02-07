"""Autonomous SAR drone agent; A2A via ZeroMQ."""
import asyncio
import random
import time
import uuid
from dataclasses import dataclass, field
from typing import Optional, List, Set, Dict, Any, Callable
from enum import Enum
import logging

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
    """SAR drone: nearest-tile search, handoff at low battery, heartbeats."""

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
    
    async def tick(self, current_time: float, target_positions: Set[tuple]) -> List[Message]:
        messages_sent = []
        if self.state == DroneState.DEAD:
            return messages_sent
        if self.battery <= self.CRITICAL_BATTERY:
            self.state = DroneState.DEAD
            return messages_sent

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
                moved = await self._move_towards(target_tile)
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
        unvisited = self.assigned_tiles - self.visited_tiles
        if not unvisited:
            return None
        
        current = (self.position.x, self.position.y)
        return min(unvisited, key=lambda t: abs(t[0] - current[0]) + abs(t[1] - current[1]))

    async def _move_towards(self, target: tuple) -> bool:
        dx = target[0] - self.position.x
        dy = target[1] - self.position.y
        if dx == 0 and dy == 0:
            return False
        if abs(dx) >= abs(dy):
            self.position.x += 1 if dx > 0 else -1
        else:
            self.position.y += 1 if dy > 0 else -1
        
        return True

    def assign_tiles(self, tiles: List[tuple]):
        self.assigned_tiles.update(tiles)
        if self.state == DroneState.IDLE and self.assigned_tiles:
            self.state = DroneState.SEARCHING
