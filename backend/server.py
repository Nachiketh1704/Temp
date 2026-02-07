from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import zmq.asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

from sim.environment import SimulationEnvironment, SimulationConfig
from sim.metrics import MetricsTracker
from comms.message_bus import MessageBus
from ui.dashboard import DashboardBroadcaster

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Drone SAR Simulation API")
api_router = APIRouter(prefix="/api")

simulation_state = {
    "sim": None,
    "message_bus": None,
    "metrics": None,
    "broadcaster": DashboardBroadcaster(),
    "zmq_context": None,
    "task": None,
    "message_log": []
}

class SimulationConfigModel(BaseModel):
    grid_width: int = Field(default=20, ge=5, le=50)
    grid_height: int = Field(default=20, ge=5, le=50)
    num_agents: int = Field(default=4, ge=2, le=10)
    num_targets: int = Field(default=5, ge=1, le=20)
    duration_seconds: int = Field(default=180, ge=30, le=600)
    seed: int = Field(default=42)
    tick_interval: float = Field(default=0.5, ge=0.1, le=2.0)
    detection_probability: float = Field(default=0.7, ge=0.1, le=1.0)

class SimulationCommand(BaseModel):
    action: str

@api_router.get("/")
async def root():
    return {"message": "Drone SAR Simulation API", "version": "1.0.0"}

@api_router.get("/simulation/state")
async def get_simulation_state():
    """Current simulation state."""
    if simulation_state["sim"]:
        return simulation_state["sim"].get_full_state()
    return {"status": "not_initialized"}

@api_router.get("/simulation/metrics")
async def get_metrics():
    """Current metrics."""
    if simulation_state["metrics"]:
        return simulation_state["metrics"].get_current_metrics()
    return {"status": "not_initialized"}

@api_router.get("/simulation/metrics/history")
async def get_metrics_history():
    """Metrics history."""
    if simulation_state["metrics"]:
        return {"history": simulation_state["metrics"].get_history()}
    return {"history": []}

@api_router.get("/simulation/messages")
async def get_messages(limit: int = Query(default=50, le=200)):
    """Recent A2A messages."""
    return {"messages": simulation_state["message_log"][-limit:]}

@api_router.get("/simulation/ground-agent")
async def get_ground_agent_state():
    """Get ground agent status and statistics."""
    if simulation_state["sim"] and simulation_state["sim"].ground_agent:
        return simulation_state["sim"].ground_agent.get_state()
    return {"status": "not_initialized"}

@api_router.get("/simulation/cnn-stats")
async def get_cnn_stats():
    """Get CNN person detector statistics."""
    try:
        from models.person_detector import get_person_detector
        detector = get_person_detector()
        return {"stats": detector.get_stats()}
    except Exception as e:
        return {"error": str(e), "stats": None}

@api_router.get("/simulation/image-stats")
async def get_image_stats():
    """Get image manager statistics."""
    try:
        from models.image_manager import get_image_manager
        image_mgr = get_image_manager()
        return {"stats": image_mgr.get_stats()}
    except Exception as e:
        return {"error": str(e), "stats": None}

@api_router.post("/simulation/init")
async def initialize_simulation(config: SimulationConfigModel):
    """Initialize simulation with given config."""
    try:
        if simulation_state["sim"]:
            await cleanup_simulation()

        simulation_state["zmq_context"] = zmq.asyncio.Context()
        message_bus = MessageBus(simulation_state["zmq_context"])
        await message_bus.start()
        simulation_state["message_bus"] = message_bus

        sim_config = SimulationConfig(
            grid_width=config.grid_width,
            grid_height=config.grid_height,
            num_agents=config.num_agents,
            num_targets=config.num_targets,
            duration_seconds=config.duration_seconds,
            seed=config.seed,
            tick_interval=config.tick_interval,
            detection_probability=config.detection_probability
        )

        metrics = MetricsTracker(
            total_targets=config.num_targets,
            total_tiles=config.grid_width * config.grid_height,
            total_agents=config.num_agents
        )
        simulation_state["metrics"] = metrics

        sim = SimulationEnvironment(sim_config, message_bus)
        sim.initialize_agents()
        simulation_state["sim"] = sim

        simulation_state["message_log"] = []

        def on_message(msg):
            simulation_state["message_log"].append(msg)
            if len(simulation_state["message_log"]) > 200:
                simulation_state["message_log"] = simulation_state["message_log"][-200:]
            
            metrics.record_message(msg.get("type", ""))
            if msg.get("type") == "TARGET_FOUND":
                metrics.record_target_found()

            asyncio.create_task(simulation_state["broadcaster"].broadcast_message(msg))

        message_bus.on_message_callback = on_message

        def on_state_update(state):
            metrics.update(
                tick=state["state"]["tick"],
                agents=state["agents"],
                visited_count=len(state["grid"]["visited_tiles"]),
                targets_found=len(state["grid"]["target_positions"]),
                msg_stats=state["message_stats"]
            )
            asyncio.create_task(simulation_state["broadcaster"].broadcast_state(state))

        sim.on_state_update = on_state_update
        
        logger.info("Simulation initialized with config: %s", config.model_dump())
        
        return {
            "status": "initialized",
            "config": sim_config.to_dict(),
            "state": sim.get_full_state()
        }
        
    except Exception as e:
        logger.error("Failed to initialize simulation: %s", e)
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@api_router.post("/simulation/command")
async def simulation_command(command: SimulationCommand):
    """Run simulation command (start/stop/pause/resume/reset)."""
    sim = simulation_state["sim"]
    metrics = simulation_state["metrics"]
    
    if not sim:
        return JSONResponse(
            status_code=400,
            content={"error": "Simulation not initialized"}
        )
    
    action = command.action.lower()
    
    if action == "start":
        if simulation_state["task"] and not simulation_state["task"].done():
            return {"status": "already_running"}

        metrics.start()
        simulation_state["task"] = asyncio.create_task(sim.start())
        return {"status": "started"}
    
    elif action == "stop":
        await sim.stop()
        if simulation_state["task"]:
            simulation_state["task"].cancel()
            try:
                await simulation_state["task"]
            except asyncio.CancelledError:
                pass
        return {
            "status": "stopped",
            "summary": metrics.get_summary() if metrics else {}
        }
    
    elif action == "pause":
        sim.pause()
        return {"status": "paused"}
    
    elif action == "resume":
        sim.resume()
        return {"status": "resumed"}
    
    elif action == "reset":
        if simulation_state["task"] and not simulation_state["task"].done():
            await sim.stop()
            simulation_state["task"].cancel()
            try:
                await simulation_state["task"]
            except asyncio.CancelledError:
                pass
        
        sim.reset()
        simulation_state["message_log"] = []

        if metrics:
            metrics.__init__(
                total_targets=sim.config.num_targets,
                total_tiles=sim.total_tiles,
                total_agents=sim.config.num_agents
            )
        
        return {"status": "reset", "state": sim.get_full_state()}
    
    return JSONResponse(
        status_code=400,
        content={"error": f"Unknown action: {action}"}
    )

@api_router.post("/simulation/record")
async def start_recording():
    """Start recording."""
    sim = simulation_state["sim"]
    if not sim:
        return JSONResponse(status_code=400, content={"error": "Simulation not initialized"})
    
    sim.start_recording()
    return {"status": "recording_started"}

@api_router.post("/simulation/save-replay")
async def save_replay(filename: str = Query(default="replay.json")):
    """Save recording to file."""
    sim = simulation_state["sim"]
    if not sim:
        return JSONResponse(status_code=400, content={"error": "Simulation not initialized"})
    
    filepath = ROOT_DIR / filename
    sim.save_replay(str(filepath))
    return {"status": "saved", "file": str(filepath)}

@api_router.get("/simulation/replay/{filename}")
async def load_replay(filename: str):
    """Load replay from file."""
    filepath = ROOT_DIR / filename
    if not filepath.exists():
        return JSONResponse(status_code=404, content={"error": "Replay file not found"})
    
    data = SimulationEnvironment.load_replay(str(filepath))
    return data

async def cleanup_simulation():
    """Release simulation resources."""
    if simulation_state["task"] and not simulation_state["task"].done():
        simulation_state["task"].cancel()
        try:
            await simulation_state["task"]
        except asyncio.CancelledError:
            pass
    
    if simulation_state["message_bus"]:
        await simulation_state["message_bus"].stop()
    
    if simulation_state["zmq_context"]:
        simulation_state["zmq_context"].term()
    
    simulation_state["sim"] = None
    simulation_state["message_bus"] = None
    simulation_state["metrics"] = None
    simulation_state["zmq_context"] = None
    simulation_state["task"] = None

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    simulation_state["broadcaster"].add_client(websocket)

    try:
        if simulation_state["sim"]:
            await websocket.send_text(json.dumps({
                "type": "INITIAL_STATE",
                "data": simulation_state["sim"].get_full_state()
            }))

            for msg in simulation_state["message_log"][-50:]:
                await websocket.send_text(json.dumps({
                    "type": "A2A_MESSAGE",
                    "data": msg
                }))

        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "KEEPALIVE"}))
                
    except WebSocketDisconnect:
        simulation_state["broadcaster"].remove_client(websocket)
    except Exception as e:
        logger.error("WebSocket error: %s", e)
        simulation_state["broadcaster"].remove_client(websocket)

app.include_router(api_router)

frontend_build = ROOT_DIR.parent / 'frontend' / 'build'
if frontend_build.exists():
    app.mount("/static", StaticFiles(directory=frontend_build / "static"), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve frontend SPA."""
        file_path = frontend_build / "index.html"
        if file_path.exists():
            return FileResponse(file_path)
        return JSONResponse(status_code=404, content={"error": "Not found"})
else:
    logger.warning("Frontend build directory not found at %s", frontend_build)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_event():
    await cleanup_simulation()
    client.close()


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
