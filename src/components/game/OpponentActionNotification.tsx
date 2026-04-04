import { GameLogEntry } from '@/types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Swords, Sparkles, Shield, Zap, Skull, Heart, RotateCcw, Trash2, Flame, AlertTriangle } from 'lucide-react';

interface OpponentActionNotificationProps {
  log: GameLogEntry[];
  localPlayerName: string;
}

interface Notification {
  id: string;
  message: string;
  icon: 'spell' | 'activation' | 'reaction' | 'metamorphose' | 'incapacitate' | 'heal' | 'retro' | 'remove' | 'ether_destroy';
  timestamp: number;
  isTargetingMe: boolean;
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

const TARGETED_ICON = <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />;

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
  if (action === 'Éther détruit' || action === 'Éther volé') return 'ether_destroy';
  return 'spell';
}

/** Check if the log entry detail references the local player as a target */
function isTargetingPlayer(entry: GameLogEntry, localPlayerName: string): boolean {
  const { detail, playerName } = entry;
  // The acting player is never "targeting themselves" from our perspective
  if (playerName === localPlayerName) return false;

  // Common patterns in detail text that reference a target god:
  // "... de Apollon", "... d'Apollon", "... à Apollon", "... chez Apollon"
  // "... cible Apollon", "... contre Apollon"
  const escapedName = localPlayerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const targetPatterns = new RegExp(
    `(?:de |d'|à |chez |cible |contre |sur )${escapedName}\\b|\\b${escapedName}(?:\\s|$|\\.)`,
    'i'
  );
  return targetPatterns.test(detail);
}

/** Build a clean third-person notification message from a log entry */
function buildNotificationMessage(entry: GameLogEntry, isTargeted: boolean): string {
  const { playerName, action, detail } = entry;

  if (action === 'Sort joué') {
    const spellMatch = detail.match(/a joué (.+?) \(coût:/);
    const descMatch = detail.match(/— (.+)$/);
    const spellName = spellMatch?.[1] || 'un sortilège';
    const desc = descMatch?.[1] || '';
    const base = desc
      ? `${playerName} a joué « ${spellName} » — ${desc}`
      : `${playerName} a joué « ${spellName} »`;
    return isTargeted ? `⚠️ ${base}` : base;
  }

  if (action === 'Incapacitation') {
    const msg = `${playerName} ${detail}`;
    return isTargeted ? `⚠️ ${msg}` : msg;
  }

  if (action === 'Guérison' || action === 'Guérison totale') {
    return `${playerName} ${detail}`;
  }

  if (action === 'Retrait du jeu') {
    const msg = `${playerName} ${detail}`;
    return isTargeted ? `⚠️ ${msg}` : msg;
  }

  if (action === 'Métamorphose') {
    const metaMatch = detail.match(/a métamorphosé (.+?) → (.+?) \(coût: (\d+)/);
    if (metaMatch) {
      return `${playerName} a métamorphosé ${metaMatch[1]} en ${metaMatch[2]} (coût : ${metaMatch[3]} Éther)`;
    }
    return `${playerName} ${detail}`;
  }

  if (action === 'Activation') {
    const msg = `${playerName} ${detail}`;
    return isTargeted ? `⚠️ ${msg}` : msg;
  }

  if (action === 'Réaction posée') {
    return `${playerName} a posé une réaction face cachée`;
  }

  if (action === 'Éther détruit' || action === 'Éther volé') {
    const msg = `${playerName} ${detail}`;
    return isTargeted ? `⚠️ ${msg}` : msg;
  }

  const msg = `${playerName} ${detail}`;
  return isTargeted ? `⚠️ ${msg}` : msg;
}

const OpponentActionNotification = ({ log, localPlayerName }: OpponentActionNotificationProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const seenIds = useRef(new Set<string>());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      for (const entry of log) {
        seenIds.current.add(entry.id);
      }
      return;
    }

    for (const entry of log) {
      if (seenIds.current.has(entry.id)) continue;
      seenIds.current.add(entry.id);

      if (entry.playerName === localPlayerName || entry.playerName === 'Système') continue;
      if (!NOTIFIABLE_ACTIONS.has(entry.action)) continue;

      const targeted = isTargetingPlayer(entry, localPlayerName);

      const notif: Notification = {
        id: entry.id,
        message: buildNotificationMessage(entry, targeted),
        icon: getNotificationIcon(entry.action),
        timestamp: Date.now(),
        isTargetingMe: targeted,
      };

      setNotifications(prev => [notif, ...prev].slice(0, 5));
    }
  }, [log, localPlayerName]);

  // Auto-dismiss: targeted notifications last 8s, normal ones 6s
  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setInterval(() => {
      setNotifications(prev => prev.filter(n => {
        const ttl = n.isTargetingMe ? 8000 : 6000;
        return Date.now() - n.timestamp < ttl;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [notifications.length]);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl pointer-events-auto max-w-lg ${
              notif.isTargetingMe ? 'ring-2' : ''
            }`}
            style={{
              background: notif.isTargetingMe
                ? 'hsl(var(--destructive) / 0.15)'
                : 'hsl(var(--card) / 0.95)',
              border: notif.isTargetingMe
                ? '2px solid hsl(var(--destructive) / 0.7)'
                : '1px solid hsl(var(--border) / 0.5)',
              backdropFilter: 'blur(12px)',
              boxShadow: notif.isTargetingMe
                ? '0 4px 30px hsl(var(--destructive) / 0.35)'
                : '0 4px 24px hsl(0 0% 0% / 0.4)',
              
            }}
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: notif.isTargetingMe ? [1, 1.03, 1] : 1,
            }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          >
            {notif.isTargetingMe ? TARGETED_ICON : ICON_MAP[notif.icon]}
            <span className={`font-display text-sm font-semibold ${
              notif.isTargetingMe ? 'text-destructive' : 'text-foreground'
            }`}>
              {notif.isTargetingMe && (
                <span className="uppercase tracking-wider text-xs mr-2 opacity-80">Vous êtes ciblé !</span>
              )}
              {notif.message}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default OpponentActionNotification;
