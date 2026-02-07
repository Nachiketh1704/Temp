"""Simulation metrics tracking."""
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

@dataclass
class MetricsSnapshot:
    """Metrics at a point in time."""
    timestamp: float
    tick: int
    coverage_percent: float
    targets_found: int
    total_targets: int
    active_agents: int
    total_agents: int
    handoffs: int
    messages_sent: int
    avg_battery: float
    
    def to_dict(self) -> dict:
        return {
            "timestamp": round(self.timestamp, 2),
            "tick": self.tick,
            "coverage_percent": round(self.coverage_percent, 1),
            "targets_found": self.targets_found,
            "total_targets": self.total_targets,
            "active_agents": self.active_agents,
            "total_agents": self.total_agents,
            "handoffs": self.handoffs,
            "messages_sent": self.messages_sent,
            "avg_battery": round(self.avg_battery, 1)
        }

class MetricsTracker:
    """Time-to-first-detection, coverage, handoffs, battery, message count."""

    def __init__(self, total_targets: int, total_tiles: int, total_agents: int):
        self.total_targets = total_targets
        self.total_tiles = total_tiles
        self.total_agents = total_agents
        self.start_time: Optional[float] = None
        self.first_detection_time: Optional[float] = None
        self.handoff_count = 0
        self.message_count = 0
        self.history: List[MetricsSnapshot] = []
        self.targets_found = 0
        self.visited_tiles = 0
        self.active_agents = total_agents
        self.total_messages = 0
    
    def start(self):
        self.start_time = time.time()
        self.first_detection_time = None
        self.handoff_count = 0
        self.message_count = 0
        self.history.clear()
    
    def record_target_found(self):
        self.targets_found += 1
        if self.first_detection_time is None and self.start_time:
            self.first_detection_time = time.time() - self.start_time
    
    def record_handoff(self):
        """Record a successful handoff"""
        self.handoff_count += 1
    
    def record_message(self, msg_type: str):
        """Record a message sent"""
        self.message_count += 1
        if msg_type in ["ACCEPT_HANDOFF"]:
            self.record_handoff()
    
    def update(self, tick: int, agents: List[dict], visited_count: int, targets_found: int, msg_stats: dict):
        if not self.start_time:
            return
        
        current_time = time.time() - self.start_time
        active = sum(1 for a in agents if a.get("state") != "dead")
        avg_battery = sum(a.get("battery", 0) for a in agents) / len(agents) if agents else 0
        if targets_found > 0 and self.first_detection_time is None:
            self.first_detection_time = current_time

        snapshot = MetricsSnapshot(
            timestamp=current_time,
            tick=tick,
            coverage_percent=(visited_count / self.total_tiles) * 100,
            targets_found=targets_found,
            total_targets=self.total_targets,
            active_agents=active,
            total_agents=self.total_agents,
            handoffs=self.handoff_count,
            messages_sent=msg_stats.get("total_sent", 0),
            avg_battery=avg_battery
        )
        
        self.history.append(snapshot)
        self.targets_found = targets_found
        self.visited_tiles = visited_count
        self.active_agents = active
        self.total_messages = msg_stats.get("total_sent", 0)
    
    def get_current_metrics(self) -> dict:
        """Get current metric values"""
        return {
            "time_to_first_detection": round(self.first_detection_time, 2) if self.first_detection_time else None,
            "coverage_percent": round((self.visited_tiles / self.total_tiles) * 100, 1) if self.total_tiles else 0,
            "targets_found": self.targets_found,
            "total_targets": self.total_targets,
            "handoffs": self.handoff_count,
            "active_agents": self.active_agents,
            "total_agents": self.total_agents,
            "total_messages": self.total_messages,
            "avg_battery": round(
                sum(s.avg_battery for s in self.history[-1:]) / 1 if self.history else 100, 1
            )
        }
    
    def get_summary(self) -> dict:
        """Get final summary metrics"""
        if not self.history:
            return self.get_current_metrics()
        
        final = self.history[-1]
        return {
            "time_to_first_detection": round(self.first_detection_time, 2) if self.first_detection_time else "N/A",
            "final_coverage_percent": round(final.coverage_percent, 1),
            "targets_found": f"{final.targets_found}/{self.total_targets}",
            "total_handoffs": self.handoff_count,
            "avg_battery_at_end": round(final.avg_battery, 1),
            "total_messages_exchanged": final.messages_sent,
            "duration_seconds": round(final.timestamp, 1)
        }
    
    def get_history(self) -> List[dict]:
        """Get metrics history for graphing"""
        return [s.to_dict() for s in self.history]
