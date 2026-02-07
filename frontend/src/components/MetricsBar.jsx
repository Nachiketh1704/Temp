import { 
  Timer, 
  Target, 
  MapPin, 
  Repeat, 
  MessageSquare,
  Battery,
  Users
} from 'lucide-react';

export const MetricsBar = ({ metrics, elapsedTime, config }) => {
  const metricItems = [
    {
      icon: Timer,
      label: 'First Detection',
      value: (metrics.time_to_first_detection && typeof metrics.time_to_first_detection === 'number') 
        ? `${metrics.time_to_first_detection.toFixed(1)}s` 
        : '—',
      color: (metrics.time_to_first_detection && typeof metrics.time_to_first_detection === 'number') ? 'text-[#10B981]' : 'text-[#71717A]'
    },
    {
      icon: MapPin,
      label: 'Coverage',
      value: `${metrics.coverage_percent?.toFixed(1) || 0}%`,
      color: metrics.coverage_percent > 50 ? 'text-[#10B981]' : 'text-[#F59E0B]'
    },
    {
      icon: Target,
      label: 'Targets Found',
      value: `${metrics.targets_found || 0}/${metrics.total_targets || config.num_targets}`,
      color: metrics.targets_found > 0 ? 'text-[#EF4444]' : 'text-[#71717A]'
    },
    {
      icon: Repeat,
      label: 'Handoffs',
      value: metrics.handoffs || 0,
      color: 'text-[#A855F7]'
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      value: metrics.total_messages || 0,
      color: 'text-[#3B82F6]'
    },
    {
      icon: Battery,
      label: 'Avg Battery',
      value: `${(metrics.avg_battery || 100).toFixed(1)}%`,
      color: metrics.avg_battery > 50 ? 'text-[#10B981]' : metrics.avg_battery > 25 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
    },
    {
      icon: Users,
      label: 'Active Agents',
      value: `${metrics.active_agents || 0}/${metrics.total_agents || config.num_agents}`,
      color: metrics.active_agents === metrics.total_agents ? 'text-[#10B981]' : 'text-[#F59E0B]'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3" data-testid="metrics-bar">
      {metricItems.map((item, index) => (
        <div 
          key={item.label}
          className="bg-[#18181B] border border-[#27272A] rounded-lg p-3 hover:border-[#3F3F46] transition-colors"
          data-testid={`metric-${item.label.toLowerCase().replace(' ', '-')}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <item.icon className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="text-[10px] uppercase tracking-wider text-[#71717A]">
              {item.label}
            </span>
          </div>
          <div className={`font-heading text-xl font-bold ${item.color}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsBar;
