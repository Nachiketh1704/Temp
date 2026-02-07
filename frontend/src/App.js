import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import TacticalMap from "@/components/TacticalMap";
import DroneCard from "@/components/DroneCard";
import LogTerminal from "@/components/LogTerminal";
import MetricsBar from "@/components/MetricsBar";
import SimulationControls from "@/components/SimulationControls";
import { 
  Radar, 
  Activity,
  Settings,
  Radio
} from "lucide-react";

// Backend: env in prod, or relative in dev (proxy → :8000)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";
const WS_URL = BACKEND_URL
  ? (BACKEND_URL.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://") + "/ws")
  : `ws://${window.location.host}/ws`;

const Dashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [simulationState, setSimulationState] = useState(null);
  const [agents, setAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [metrics, setMetrics] = useState({
    time_to_first_detection: null,
    coverage_percent: 0,
    targets_found: 0,
    total_targets: 5,
    handoffs: 0,
    total_messages: 0,
    avg_battery: 100,
    active_agents: 0,
    total_agents: 0
  });
  const [config, setConfig] = useState({
    grid_width: 17,
    grid_height: 15,
    num_agents: 4,
    num_targets: 5,
    duration_seconds: 180,
    seed: 42,
    tick_interval: 0.5,
    detection_probability: 0.7
  });
  const [grid, setGrid] = useState({
    width: 17,
    height: 15,
    visited_tiles: [],
    target_positions: []
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      toast.success("Connected to simulation server");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "INITIAL_STATE" || data.type === "STATE_UPDATE") {
          const state = data.data;
          setSimulationState(state);
          setAgents(state.agents || []);
          setGrid(state.grid || { width: 17, height: 15, visited_tiles: [], target_positions: [] });
          setElapsedTime(state.state?.elapsed_time || 0);
          setIsRunning(state.state?.is_running || false);
          setIsPaused(state.state?.is_paused || false);

          setMetrics(prev => ({
            ...prev,
            total_messages: state.message_stats?.total_sent || 0,
            coverage_percent: state.state?.coverage_percent || 0,
            targets_found: state.state?.targets_found?.length || state.grid?.target_positions?.length || 0,
            active_agents: state.agents?.filter(a => a.state !== 'dead').length || 0,
            total_agents: state.agents?.length || 0,
            avg_battery: state.agents?.length > 0 
              ? state.agents.reduce((sum, a) => sum + a.battery, 0) / state.agents.length 
              : 100,
            handoffs: state.message_stats?.by_type?.ACCEPT_HANDOFF || 0
          }));
        } else if (data.type === "A2A_MESSAGE") {
          setMessages(prev => {
            const newMessages = [...prev, data.data];
            return newMessages.slice(-100);
          });
        } else if (data.type === "METRICS_UPDATE") {
          setMetrics(prev => ({ ...prev, ...data.data }));
        }
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, []);

  const fetchInitialState = async () => {
    try {
      const response = await axios.get(`${API}/simulation/state`);
      if (response.data && response.data.status !== "not_initialized") {
        setSimulationState(response.data);
        setAgents(response.data.agents || []);
        setGrid(response.data.grid || { width: 17, height: 15, visited_tiles: [], target_positions: [] });
        setConfig(response.data.config || config);
        setIsInitialized(true);
        setIsRunning(response.data.state?.is_running || false);
        setIsPaused(response.data.state?.is_paused || false);
        setElapsedTime(response.data.state?.elapsed_time || 0);

        const msgResponse = await axios.get(`${API}/simulation/messages?limit=50`);
        if (msgResponse.data.messages) {
          setMessages(msgResponse.data.messages);
        }
      }
    } catch (error) {
      console.log("No active simulation");
    }
  };

  useEffect(() => {
    fetchInitialState();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  const initializeSimulation = async (newConfig = config) => {
    try {
      const response = await axios.post(`${API}/simulation/init`, newConfig);
      if (response.data.status === "initialized") {
        setIsInitialized(true);
        setConfig(response.data.config);
        toast.success("Simulation initialized");

        if (response.data.state) {
          setSimulationState(response.data.state);
          setAgents(response.data.state.agents || []);
          setGrid(response.data.state.grid || { width: 17, height: 15, visited_tiles: [], target_positions: [] });
        }
      }
    } catch (error) {
      toast.error("Failed to initialize simulation");
      console.error(error);
    }
  };

  const sendCommand = async (action) => {
    try {
      const response = await axios.post(`${API}/simulation/command`, { action });
      
      if (action === "start") {
        setIsRunning(true);
        setIsPaused(false);
        toast.success("Simulation started");
      } else if (action === "stop") {
        setIsRunning(false);
        toast.info("Simulation stopped");
        if (response.data.summary) {
          setMetrics(prev => ({ ...prev, ...response.data.summary }));
        }
      } else if (action === "pause") {
        setIsPaused(true);
        toast.info("Simulation paused");
      } else if (action === "resume") {
        setIsPaused(false);
        toast.success("Simulation resumed");
      } else if (action === "reset") {
        setIsRunning(false);
        setIsPaused(false);
        setMessages([]);
        setElapsedTime(0);
        toast.success("Simulation reset");
        
        if (response.data.state) {
          setSimulationState(response.data.state);
          setAgents(response.data.state.agents || []);
          setGrid(response.data.state.grid || { width: 17, height: 15, visited_tiles: [], target_positions: [] });
        }
      }
    } catch (error) {
      toast.error(`Command failed: ${action}`);
      console.error(error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`${API}/simulation/metrics`);
      if (response.data.status !== "not_initialized") {
        setMetrics(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    }
  };

  useEffect(() => {
    if (isRunning && !isPaused) {
      const interval = setInterval(fetchMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [isRunning, isPaused]);

  return (
    <div className="min-h-screen bg-[#09090B] noise-texture" data-testid="dashboard-container">
      <header className="h-16 border-b border-[#27272A] bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
            <Radar className="w-6 h-6 text-[#3B82F6]" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-[#FAFAFA]">
              DRONE SAR COMMAND
            </h1>
            <p className="text-xs text-[#71717A]">Multi-Agent Search & Rescue Simulation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`status-dot ${isConnected ? 'status-active' : 'status-dead'}`} />
            <span className="text-xs text-[#A1A1AA]">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#18181B] rounded-lg border border-[#27272A]">
            <Activity className="w-4 h-4 text-[#3B82F6]" />
            <span className="font-mono text-sm text-[#FAFAFA]">
              {Math.floor(elapsedTime)}s / {config.duration_seconds}s
            </span>
          </div>
        </div>
      </header>

      <main className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-4rem)]">
        {/* Metrics Bar - Full Width */}
        <div className="lg:col-span-4" data-testid="metrics-section">
          <MetricsBar 
            metrics={metrics}
            elapsedTime={elapsedTime}
            config={config}
          />
        </div>

        <div className="lg:col-span-3 lg:row-span-2 relative bg-black/40 border border-[#27272A] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5" data-testid="tactical-map-container">
          <div className="corner-greeble top-left" />
          <div className="corner-greeble top-right" />
          <div className="corner-greeble bottom-left" />
          <div className="corner-greeble bottom-right" />
          
          <div className="scanlines h-full">
            <TacticalMap 
              grid={grid}
              agents={agents}
              config={config}
            />
          </div>
        </div>

        <div className="lg:col-span-1 lg:row-span-2 flex flex-col gap-4 overflow-hidden" data-testid="agent-panel">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-[#A1A1AA]" />
              <span className="text-sm font-medium text-[#FAFAFA]">Simulation Controls</span>
            </div>
            <SimulationControls 
              isInitialized={isInitialized}
              isRunning={isRunning}
              isPaused={isPaused}
              config={config}
              setConfig={setConfig}
              onInitialize={() => initializeSimulation(config)}
              onCommand={sendCommand}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-[#A1A1AA]" />
              <span className="text-sm font-medium text-[#FAFAFA]">Active Units</span>
            </div>
            {agents.length > 0 ? (
              agents.map((agent, index) => (
                <DroneCard 
                  key={agent.agent_id} 
                  agent={agent}
                  index={index}
                />
              ))
            ) : (
              <div className="text-center py-8 text-[#71717A] text-sm">
                Initialize simulation to see agents
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 h-48 bg-black border-t border-[#27272A] rounded-xl overflow-hidden" data-testid="log-terminal">
          <LogTerminal messages={messages} />
        </div>
      </main>
      
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
};

function App() {
  return (
    <div className="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
