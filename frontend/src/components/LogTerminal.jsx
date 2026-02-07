import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

export const LogTerminal = ({ messages }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getMessageColor = (type) => {
    const colors = {
      OFFER_TILE: 'msg-offer',
      ACCEPT_OFFER: 'msg-accept',
      HANDOFF_REQUEST: 'msg-handoff',
      ACCEPT_HANDOFF: 'msg-accept',
      HEARTBEAT: 'msg-heartbeat',
      TARGET_FOUND: 'msg-target'
    };
    return colors[type] || 'text-[#A1A1AA]';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 1
    });
  };

  const formatPayload = (type, payload) => {
    if (!payload) return '';
    
    switch (type) {
      case 'HEARTBEAT':
        return `pos:(${payload.position?.x},${payload.position?.y}) bat:${payload.battery?.toFixed(1)}%`;
      case 'TARGET_FOUND':
        return `🎯 TARGET @ (${payload.position?.x},${payload.position?.y})`;
      case 'OFFER_TILE':
        return `offering ${payload.tiles?.length || 0} tiles`;
      case 'ACCEPT_OFFER':
        return `accepted ${payload.accepted_tiles?.length || 0} tiles`;
      case 'HANDOFF_REQUEST':
        return `requesting handoff of ${payload.tiles?.length || 0} tiles (bat:${payload.battery?.toFixed(1)}%)`;
      case 'ACCEPT_HANDOFF':
        return `accepted handoff from ${payload.from_agent}`;
      default:
        return JSON.stringify(payload).slice(0, 50);
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="log-terminal">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#27272A] bg-[#0D0D0F]">
        <Terminal className="w-4 h-4 text-[#3B82F6]" />
        <span className="text-xs font-medium text-[#FAFAFA]">A2A Message Log</span>
        <span className="text-[10px] text-[#71717A] ml-auto font-mono">
          {messages.length} messages
        </span>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto terminal-scroll p-2 font-mono text-xs bg-black"
      >
        {messages.length === 0 ? (
          <div className="text-[#71717A] text-center py-4">
            Awaiting transmissions...
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={`${msg.message_id || index}-${msg.timestamp}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2 py-0.5 hover:bg-[#18181B] px-1 rounded"
                data-testid={`log-message-${index}`}
              >
                <span className="text-[#71717A] shrink-0">
                  [{formatTime(msg.timestamp)}]
                </span>

                <span className="text-[#F59E0B] shrink-0 w-20">
                  {msg.agent_id}
                </span>

                <span className={`shrink-0 w-28 ${getMessageColor(msg.type)}`}>
                  {msg.type}
                </span>

                <span className="text-[#A1A1AA] truncate">
                  {formatPayload(msg.type, msg.payload)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default LogTerminal;
