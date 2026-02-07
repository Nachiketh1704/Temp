"""ZeroMQ in-process A2A message bus."""
import asyncio
import json
import logging
from typing import Callable, Dict, List, Any, Optional
from dataclasses import dataclass
import zmq
import zmq.asyncio

logger = logging.getLogger(__name__)

@dataclass
class MessageStats:
    """Message counts by type."""
    total_sent: int = 0
    total_received: int = 0
    by_type: Dict[str, int] = None
    
    def __post_init__(self):
        if self.by_type is None:
            self.by_type = {}
    
    def record_sent(self, msg_type: str):
        self.total_sent += 1
        self.by_type[msg_type] = self.by_type.get(msg_type, 0) + 1
    
    def record_received(self, msg_type: str):
        self.total_received += 1
    
    def to_dict(self) -> dict:
        return {
            "total_sent": self.total_sent,
            "total_received": self.total_received,
            "by_type": self.by_type
        }

class MessageBus:
    """PUB/SUB in-process (inproc://); agents filter by sender."""

    def __init__(self, context: Optional[zmq.asyncio.Context] = None):
        self.context = context or zmq.asyncio.Context()
        self.pub_socket: Optional[zmq.asyncio.Socket] = None
        self.sub_socket: Optional[zmq.asyncio.Socket] = None
        self.handlers: Dict[str, Callable] = {}
        self.message_log: List[dict] = []
        self.record_messages = False
        self.stats = MessageStats()
        self.running = False
        self._receiver_task: Optional[asyncio.Task] = None
        self.on_message_callback: Optional[Callable[[dict], None]] = None

    async def start(self, pub_address: str = "inproc://drone_messages"):
        self.pub_socket = self.context.socket(zmq.PUB)
        self.pub_socket.bind(pub_address)
        self.sub_socket = self.context.socket(zmq.SUB)
        self.sub_socket.connect(pub_address)
        self.sub_socket.setsockopt_string(zmq.SUBSCRIBE, "")
        await asyncio.sleep(0.1)
        
        self.running = True
        self._receiver_task = asyncio.create_task(self._receive_loop())
        logger.info("MessageBus started on %s", pub_address)
    
    async def stop(self):
        self.running = False
        
        if self._receiver_task:
            self._receiver_task.cancel()
            try:
                await self._receiver_task
            except asyncio.CancelledError:
                pass
        
        if self.pub_socket:
            self.pub_socket.close()
        if self.sub_socket:
            self.sub_socket.close()
        
        logger.info("MessageBus stopped")
    
    def register_handler(self, agent_id: str, handler: Callable[[dict], None]):
        self.handlers[agent_id] = handler

    def unregister_handler(self, agent_id: str):
        self.handlers.pop(agent_id, None)

    async def publish(self, message: dict):
        if not self.pub_socket:
            logger.warning("Cannot publish - MessageBus not started")
            return
        
        try:
            msg_json = json.dumps(message)
            await self.pub_socket.send_string(msg_json)
            self.stats.record_sent(message.get("type", "UNKNOWN"))
            if self.record_messages:
                self.message_log.append(message)
            if self.on_message_callback:
                self.on_message_callback(message)
                
        except Exception as e:
            logger.error("Error publishing message: %s", e)
    
    async def _receive_loop(self):
        while self.running:
            try:
                if await self.sub_socket.poll(timeout=100):
                    msg_json = await self.sub_socket.recv_string()
                    message = json.loads(msg_json)
                    
                    self.stats.record_received(message.get("type", "UNKNOWN"))
                    sender_id = message.get("agent_id")
                    for agent_id, handler in self.handlers.items():
                        if agent_id != sender_id:
                            try:
                                handler(message)
                            except Exception as e:
                                logger.error("Handler error for %s: %s", agent_id, e)
                                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in receive loop: %s", e)
                await asyncio.sleep(0.1)
    
    def get_stats(self) -> dict:
        return self.stats.to_dict()

    def get_message_log(self) -> List[dict]:
        return self.message_log.copy()

    def clear_log(self):
        self.message_log.clear()

    def start_recording(self):
        self.record_messages = True
        self.message_log.clear()

    def stop_recording(self):
        self.record_messages = False
