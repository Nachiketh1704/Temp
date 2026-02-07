import { motion } from 'framer-motion';
import { 
  Battery, 
  MapPin, 
  Target,
  Crosshair,
  Zap
} from 'lucide-react';

const DRONE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#A855F7',
  '#EC4899', '#06B6D4', '#EF4444', '#84CC16',
];

export const DroneCard = ({ agent, index }) => {
  const { 
    agent_id, 
    position, 
    battery, 
    state, 
    assigned_tiles,
    visited_tiles,
    targets_found 
  } = agent;

  const droneColor = DRONE_COLORS[index % DRONE_COLORS.length];

  const getBatteryColor = (level) => {
    if (level > 60) return 'bg-[#10B981]';
    if (level > 25) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  const getStateBadge = (state) => {
    const styles = {
      searching: { bg: 'bg-[#3B82F6]/20', text: 'text-[#3B82F6]', dot: 'status-searching' },
      idle: { bg: 'bg-[#F59E0B]/20', text: 'text-[#F59E0B]', dot: 'status-idle' },
      returning: { bg: 'bg-[#A855F7]/20', text: 'text-[#A855F7]', dot: 'status-active' },
      dead: { bg: 'bg-[#EF4444]/20', text: 'text-[#EF4444]', dot: 'status-dead' }
    };
    return styles[state] || styles.idle;
  };

  const stateStyle = getStateBadge(state);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#18181B] border border-[#27272A] rounded-lg p-3 hover:border-[#3F3F46] transition-colors"
      style={{ borderLeftColor: droneColor, borderLeftWidth: '3px' }}
      data-testid={`drone-card-${agent_id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: state !== 'dead' ? droneColor : '#EF4444' }}
          />
          <span className="font-heading font-bold text-[#FAFAFA] tracking-tight text-sm">
            {agent_id}
          </span>
        </div>
        <span className={`text-[9px] uppercase font-medium px-1.5 py-0.5 rounded ${stateStyle.bg} ${stateStyle.text}`}>
          {state}
        </span>
      </div>

      <div className="mb-2">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1 text-[#A1A1AA]">
            <Battery className="w-3 h-3" />
            <span className="text-[9px] uppercase tracking-wider">Battery</span>
          </div>
          <span className={`font-mono text-[10px] ${battery < 25 ? 'text-[#EF4444]' : 'text-[#FAFAFA]'}`}>
            {battery.toFixed(1)}%
          </span>
        </div>
        <div className="h-1 bg-[#27272A] rounded-full overflow-hidden">
          <motion.div 
            className={`h-full rounded-full ${getBatteryColor(battery)}`}
            initial={{ width: 0 }}
            animate={{ width: `${battery}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-[#0D0D0F] rounded p-1">
          <MapPin className="w-2.5 h-2.5 mx-auto text-[#71717A] mb-0.5" />
          <div className="font-mono text-[10px] text-[#FAFAFA]">
            {position.x},{position.y}
          </div>
          <div className="text-[7px] text-[#71717A] uppercase">Pos</div>
        </div>
        
        <div className="bg-[#0D0D0F] rounded p-1">
          <Crosshair className="w-2.5 h-2.5 mx-auto text-[#71717A] mb-0.5" />
          <div className="font-mono text-[10px] text-[#FAFAFA]">
            {visited_tiles || 0}
          </div>
          <div className="text-[7px] text-[#71717A] uppercase">Scan</div>
        </div>
        
        <div className="bg-[#0D0D0F] rounded p-1">
          <Target className="w-2.5 h-2.5 mx-auto text-[#71717A] mb-0.5" />
          <div className="font-mono text-[10px] text-[#10B981]">
            {targets_found || 0}
          </div>
          <div className="text-[7px] text-[#71717A] uppercase">Found</div>
        </div>
      </div>
    </motion.div>
  );
};

export default DroneCard;
