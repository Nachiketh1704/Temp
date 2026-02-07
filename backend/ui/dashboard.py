"""WebSocket broadcaster for real-time dashboard updates."""
import asyncio
import json
import logging
from typing import Set, Dict, Any, Optional, Callable
from dataclasses import dataclass

logger = logging.getLogger(__name__)

class DashboardBroadcaster:
    """WebSocket clients; broadcasts state/messages to dashboard."""

    def __init__(self):
        self.clients: Set[Any] = set()
        self.message_buffer: list = []
        self.max_buffer_size = 100
        self.messages_sent = 0

    def add_client(self, websocket):
        self.clients.add(websocket)
        logger.info("Client connected. Total clients: %d", len(self.clients))
    
    def remove_client(self, websocket):
        self.clients.discard(websocket)
        logger.info("Client disconnected. Total clients: %d", len(self.clients))
    
    async def broadcast(self, data: dict):
        if not self.clients:
            return
        
        message = json.dumps(data)
        self.message_buffer.append(data)
        if len(self.message_buffer) > self.max_buffer_size:
            self.message_buffer.pop(0)
        disconnected = set()
        for client in self.clients:
            try:
                await client.send_text(message)
                self.messages_sent += 1
            except Exception as e:
                logger.error("Error sending to client: %s", e)
                disconnected.add(client)

        for client in disconnected:
            self.remove_client(client)
    
    async def broadcast_state(self, state: dict):
        await self.broadcast({
            "type": "STATE_UPDATE",
            "data": state
        })
    
    async def broadcast_message(self, message: dict):
        await self.broadcast({
            "type": "A2A_MESSAGE",
            "data": message
        })
    
    async def broadcast_metrics(self, metrics: dict):
        await self.broadcast({
            "type": "METRICS_UPDATE",
            "data": metrics
        })
    
    def get_recent_messages(self, count: int = 50) -> list:
        return self.message_buffer[-count:]

    def get_stats(self) -> dict:
        return {
            "connected_clients": len(self.clients),
            "messages_sent": self.messages_sent,
            "buffer_size": len(self.message_buffer)
        }
