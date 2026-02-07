import { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateTileImageMap } from '@/data/tileImages';

const DRONE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#A855F7',
  '#EC4899', '#06B6D4', '#EF4444', '#84CC16',
];

export const TacticalMap = ({ grid, agents, config }) => {
  const gridWidth = grid?.width || config?.grid_width || 17;
  const gridHeight = grid?.height || config?.grid_height || 15;
  
  // Memoize arrays to prevent unnecessary re-renders
  const visitedTiles = useMemo(() => grid?.visited_tiles || [], [grid?.visited_tiles]);
  const targetPositions = useMemo(() => grid?.target_positions || [], [grid?.target_positions]);
  const allTargets = useMemo(() => grid?.all_targets || [], [grid?.all_targets]);

  const [droneTrails, setDroneTrails] = useState({});
  const [flippedTiles, setFlippedTiles] = useState(new Set());
  const [tileImageMap, setTileImageMap] = useState({});
  const prevAgentsRef = useRef(agents);

  useEffect(() => {
    if (agents && agents.length > 0) {
      setDroneTrails(prev => {
        const newTrails = { ...prev };
        agents.forEach((agent, idx) => {
          const key = agent.agent_id;
          const pos = `${agent.position.x},${agent.position.y}`;
          if (!newTrails[key]) {
            newTrails[key] = { positions: [pos], color: DRONE_COLORS[idx % DRONE_COLORS.length] };
          } else if (newTrails[key].positions[newTrails[key].positions.length - 1] !== pos) {
            newTrails[key] = {
              ...newTrails[key],
              positions: [...newTrails[key].positions.slice(-19), pos]
            };
          }
        });
        return newTrails;
      });
    }
    prevAgentsRef.current = agents;
  }, [agents]);

  // Generate tile images on mount or grid size change
  useEffect(() => {
    // Use all_targets for image mapping (shows where targets actually are)
    const targetsForMapping = allTargets.length > 0 ? allTargets : targetPositions;
    const imageMap = generateTileImageMap(gridWidth, gridHeight, targetsForMapping);
    setTileImageMap(imageMap);
    setFlippedTiles(new Set()); // Reset flipped tiles when grid changes
  }, [gridWidth, gridHeight, allTargets, targetPositions]);

  const handleTileClick = (x, y) => {
    const key = `${x},${y}`;
    setFlippedTiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const visitedSet = useMemo(() => {
    const set = new Set();
    visitedTiles.forEach(t => set.add(`${t.x},${t.y}`));
    return set;
  }, [visitedTiles]);

  const targetSet = useMemo(() => {
    const set = new Set();
    targetPositions.forEach(t => set.add(`${t.x},${t.y}`));
    return set;
  }, [targetPositions]);

  const agentMap = useMemo(() => {
    const map = new Map();
    agents.forEach((agent, idx) => {
      const key = `${agent.position.x},${agent.position.y}`;
      map.set(key, { ...agent, color: DRONE_COLORS[idx % DRONE_COLORS.length] });
    });
    return map;
  }, [agents]);

  const trailMap = useMemo(() => {
    const map = new Map();
    Object.entries(droneTrails).forEach(([agentId, trail]) => {
      trail.positions.forEach((pos, idx) => {
        if (idx < trail.positions.length - 1) {
          const opacity = 0.1 + (idx / trail.positions.length) * 0.3;
          if (!map.has(pos)) {
            map.set(pos, { color: trail.color, opacity });
          }
        }
      });
    });
    return map;
  }, [droneTrails]);

  const tileSize = Math.min(26, Math.floor(620 / Math.max(gridWidth, gridHeight)));
  const gap = 1;

  return (
    <div className="h-full w-full flex items-center justify-center p-4" data-testid="tactical-map">
      <div className="relative">
        <div 
          className="absolute -top-5 left-0 flex"
          style={{ marginLeft: `${tileSize / 2}px` }}
        >
          {Array.from({ length: gridWidth }, (_, i) => (
            <div 
              key={`x-${i}`}
              className="text-[9px] text-[#71717A] font-mono text-center"
              style={{ width: tileSize + gap }}
            >
              {i % 5 === 0 ? i : ''}
            </div>
          ))}
        </div>

        <div 
          className="absolute top-0 -left-5 flex flex-col"
          style={{ marginTop: `${tileSize / 2 - 4}px` }}
        >
          {Array.from({ length: gridHeight }, (_, i) => (
            <div 
              key={`y-${i}`}
              className="text-[9px] text-[#71717A] font-mono text-right pr-1"
              style={{ height: tileSize + gap }}
            >
              {i % 5 === 0 ? i : ''}
            </div>
          ))}
        </div>

        <div 
          className="grid"
          style={{ 
            gridTemplateColumns: `repeat(${gridWidth}, ${tileSize}px)`,
            gap: `${gap}px`
          }}
        >
          {Array.from({ length: gridHeight }, (_, y) => (
            Array.from({ length: gridWidth }, (_, x) => {
              const key = `${x},${y}`;
              const isVisited = visitedSet.has(key);
              const hasTarget = targetSet.has(key);
              const agent = agentMap.get(key);
              const trail = trailMap.get(key);
              const isFlipped = flippedTiles.has(key);
              const tileImage = tileImageMap[key];

              let bgColor = '#18181B';
              if (trail) {
                bgColor = `${trail.color}${Math.round(trail.opacity * 255).toString(16).padStart(2, '0')}`;
              }
              if (isVisited) {
                bgColor = 'rgba(16, 185, 129, 0.2)';
              }

              return (
                <div
                  key={key}
                  className="tile-container"
                  style={{
                    width: tileSize,
                    height: tileSize,
                  }}
                  onClick={() => handleTileClick(x, y)}
                  data-testid={`tile-${x}-${y}`}
                >
                  <div 
                    className={`tile-inner ${isFlipped ? 'flipped' : ''}`}
                  >
                    {/* Front face */}
                    <div
                      className="tile-face tile-front grid-tile transition-colors duration-200"
                      style={{
                        backgroundColor: bgColor,
                      }}
                    >
                      {hasTarget && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center pulse-target"
                          data-testid={`target-${x}-${y}`}
                        >
                          <div className="w-3 h-3 rounded-full bg-[#EF4444] target-glow" />
                        </div>
                      )}

                      <AnimatePresence>
                        {agent && (
                          <motion.div
                            key={agent.agent_id}
                            className="absolute inset-0 flex items-center justify-center z-10"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            data-testid={`drone-${agent.agent_id}`}
                            style={{ filter: `drop-shadow(0 0 6px ${agent.color})` }}
                          >
                            <DroneMarker agent={agent} size={tileSize - 2} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Back face - shows image */}
                    <div
                      className="tile-face tile-back"
                      style={{
                        backgroundImage: tileImage?.imageUrl ? `url(${tileImage.imageUrl})` : 'none',
                        backgroundColor: '#09090B',
                      }}
                    >
                      {tileImage?.isPerson && (
                        <div className="absolute top-1 right-1 bg-[#3B82F6]/80 text-white text-[8px] px-1 py-0.5 rounded font-bold">
                          PERSON
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )).flat()}
        </div>

        <div className="absolute -bottom-8 left-0 flex items-center gap-4 text-[10px] text-[#71717A]">
          {agents.slice(0, 4).map((agent, idx) => (
            <div key={agent.agent_id} className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: DRONE_COLORS[idx % DRONE_COLORS.length] }} 
              />
              <span>{agent.agent_id.replace('DRONE-', 'D')}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span>Target</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-[rgba(16,185,129,0.4)] rounded-sm" />
            <span>Scanned</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DroneMarker = ({ agent, size }) => {
  const isActive = agent.state !== 'dead';
  const color = agent.color || (isActive 
    ? agent.state === 'searching' ? '#3B82F6' : '#F59E0B'
    : '#EF4444');

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24"
      className="transform-gpu"
    >
      <polygon
        points="12,2 22,20 12,16 2,20"
        fill={color}
        opacity={isActive ? 1 : 0.4}
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="#FAFAFA"
        opacity={isActive ? 1 : 0.3}
      />
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="7"
        fill="#09090B"
        fontFamily="JetBrains Mono"
        fontWeight="bold"
      >
        {agent.agent_id.replace('DRONE-', '')}
      </text>
    </svg>
  );
};

export default TacticalMap;
