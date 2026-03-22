import { GameLogEntry } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Swords, Sparkles, Shield, Zap, Skull, Heart, RotateCcw, Trash2, Flame } from 'lucide-react';

interface OpponentActionNotificationProps {
  log: GameLogEntry[];
  localPlayerName: string;
}

interface Notification {
  id: string;
  message: string;
  icon: 'spell' | 'activation' | 'reaction' | 'metamorphose' | 'incapacitate' | 'heal' | 'retro' | 'remove' | 'ether_destroy';
  timestamp: number;
}

const ICON_MAP = {
  spell: <Sparkles className="w-5 h-5 text-divine" />,
  activation: <Zap className="w-5 h-5 text-amber-400" />,
  reaction: <Shield className="w-5 h-5 text-reaction" />,
  metamorphose: <Swords className="w-5 h-5 text-ether" />,
  incapacitate: <Skull className="w-5 h-5 text-destructive" />,
  heal: <Heart className="w-5 h-5 text-green-400" />,
  retro: <RotateCcw className="w-5 h-5 text-orange-400" />,
  remove: <Trash2 className="w-5 h-5 text-destructive" />,
  ether_destroy: <Flame className="w-5 h-5 text-ether" />,
};

/** Actions that warrant a notification to other players */
const NOTIFIABLE_ACTIONS = new Set([
  'Sort joué',
  'Activation',
  'Réaction posée',
  'Métamorphose',
  'Incapacitation',
  'Guérison',
  'Guérison totale',
  'Retrait du jeu',
  'Rétromorphose',
  'Éther détruit',
  'Éther volé',
]);

function getNotificationIcon(action: string): Notification['icon'] {
  if (action === 'Sort joué') return 'spell';
  if (action === 'Activation') return 'activation';
  if (action.includes('Réaction')) return 'reaction';
  if (action === 'Métamorphose') return 'metamorphose';
  if (action === 'Incapacitation') return 'incapacitate';
  if (action === 'Guérison' || action === 'Guérison totale') return 'heal';
  if (action === 'Retrait du jeu') return 'remove';
  if (action === 'Rétromorphose') return 'retro';
  return 'spell';
}

/** Build a clean third-person notification message from a log entry */
function buildNotificationMessage(entry: GameLogEntry): string {
  const { playerName, action, detail } = entry;

  // Sort joué: "Vénus a joué 'Règne' (coût: 5) — description"
  // Extract spell name and description from detail
  if (action === 'Sort joué') {
    const spellMatch = detail.match(/a joué (.+?) \(coût:/);
    const descMatch = detail.match(/— (.+)$/);
    const spellName = spellMatch?.[1] || 'un sortilège';
    const desc = descMatch?.[1] || '';
    return desc
      ? `${playerName} a joué « ${spellName} » — ${desc}`
      : `${playerName} a joué « ${spellName} »`;
  }

  // Incapacitation: "Bacchus a incapacité Source d'eau de Apollon"
  if (action === 'Incapacitation') {
    return `${playerName} ${detail}`;
  }

  // Guérison: already "a levé l'incapacité de X de Y"
  if (action === 'Guérison' || action === 'Guérison totale') {
    return `${playerName} ${detail}`;
  }

  // Retrait du jeu
  if (action === 'Retrait du jeu') {
    return `${playerName} ${detail}`;
  }

  // Métamorphose: "a métamorphosé X → Y (coût: Z)"
  if (action === 'Métamorphose') {
    const metaMatch = detail.match(/a métamorphosé (.+?) → (.+?) \(coût: (\d+)/);
    if (metaMatch) {
      return `${playerName} a métamorphosé ${metaMatch[1]} en ${metaMatch[2]} (coût : ${metaMatch[3]} Éther)`;
    }
    return `${playerName} ${detail}`;
  }

  // Activation: various formats
  if (action === 'Activation') {
    return `${playerName} ${detail}`;
  }

  // Réaction posée
  if (action === 'Réaction posée') {
    return `${playerName} a posé une réaction face cachée`;
  }

  // Default: just concatenate
  return `${playerName} ${detail}`;
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

      // Only show notifiable actions
      if (!NOTIFIABLE_ACTIONS.has(entry.action)) continue;

      const notif: Notification = {
        id: entry.id,
        message: buildNotificationMessage(entry),
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
