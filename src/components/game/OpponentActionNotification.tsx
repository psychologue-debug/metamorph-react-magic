import { GameLogEntry } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Swords, Sparkles, Shield } from 'lucide-react';

interface OpponentActionNotificationProps {
  log: GameLogEntry[];
  localPlayerName: string;
}

interface Notification {
  id: string;
  message: string;
  icon: 'attack' | 'spell' | 'reaction' | 'info';
  timestamp: number;
}

const ICON_MAP = {
  attack: <Swords className="w-5 h-5 text-destructive" />,
  spell: <Sparkles className="w-5 h-5 text-divine" />,
  reaction: <Shield className="w-5 h-5 text-reaction" />,
  info: <AlertTriangle className="w-5 h-5 text-amber-400" />,
};

/** Keywords that signal an impactful action for any player */
const IMPACTFUL_ACTIONS = [
  'Sort joué',
  'Activation',
  'Réaction posée',
  'Métamorphose',
];

function getNotificationIcon(action: string): Notification['icon'] {
  if (action === 'Sort joué') return 'spell';
  if (action === 'Activation') return 'attack';
  if (action.includes('Réaction')) return 'reaction';
  return 'info';
}

const OpponentActionNotification = ({ log, localPlayerName }: OpponentActionNotificationProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const seenIds = useRef(new Set<string>());
  const initializedRef = useRef(false);

  useEffect(() => {
    // Skip all existing log entries on first render
    if (!initializedRef.current) {
      initializedRef.current = true;
      for (const entry of log) {
        seenIds.current.add(entry.id);
      }
      return;
    }

    // Check for new impactful entries from opponents
    for (const entry of log) {
      if (seenIds.current.has(entry.id)) continue;
      seenIds.current.add(entry.id);

      // Skip own actions and system messages
      if (entry.playerName === localPlayerName || entry.playerName === 'Système') continue;

      // Only show impactful actions
      if (!IMPACTFUL_ACTIONS.includes(entry.action)) continue;

      const notif: Notification = {
        id: entry.id,
        message: `${entry.playerName} ${entry.detail}`,
        icon: getNotificationIcon(entry.action),
        timestamp: Date.now(),
      };

      setNotifications(prev => [notif, ...prev].slice(0, 5));
    }
  }, [log, localPlayerName]);

  // Auto-dismiss after 6s
  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setInterval(() => {
      setNotifications(prev => prev.filter(n => Date.now() - n.timestamp < 6000));
    }, 1000);
    return () => clearInterval(timer);
  }, [notifications.length]);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            className="flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl pointer-events-auto max-w-lg"
            style={{
              background: 'hsl(var(--card) / 0.95)',
              border: '1px solid hsl(var(--border) / 0.5)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 24px hsl(0 0% 0% / 0.4)',
            }}
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          >
            {ICON_MAP[notif.icon]}
            <span className="font-display text-sm font-semibold text-foreground">{notif.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default OpponentActionNotification;
