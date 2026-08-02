import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export interface BubbleAction {
  key: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  reason?: string;
  onClick?: () => void;
}

interface ActionBubbleProps {
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  actions: BubbleAction[];
  emptyMessage?: string;
  onClose: () => void;
}

/**
 * Contextual action bubble: appears attached to the clicked object (mortal or
 * card) and offers only the actions that are currently legal.
 * Rendered in a portal so it is never clipped and always on top.
 */
const ActionBubble = ({ x, y, title, subtitle, actions, emptyMessage, onClose }: ActionBubbleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ left: x, top: y, opacity: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 12;
    const offset = 14;

    let left = x + offset;
    if (left + rect.width + margin > window.innerWidth) left = x - rect.width - offset;
    if (left < margin) left = margin;

    let top = y - rect.height / 2;
    if (top + rect.height + margin > window.innerHeight) top = window.innerHeight - rect.height - margin;
    if (top < margin) top = margin;

    setStyle({ left, top, opacity: 1 });
  }, [x, y, actions.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const enabled = actions.filter((a) => !a.disabled);

  return createPortal(
    <>
      {/* Click-away layer */}
      <div className="fixed inset-0 z-[99998]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.12 }}
        className="rounded-xl p-2 shadow-2xl"
        style={{
          position: 'fixed',
          zIndex: 99999,
          minWidth: 220,
          maxWidth: 300,
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--divine) / 0.5)',
          boxShadow: '0 0 24px hsl(var(--divine) / 0.25)',
          ...style,
        }}
      >
        <div className="px-2 pt-1 pb-2 border-b mb-2" style={{ borderColor: 'hsl(var(--border) / 0.4)' }}>
          <div className="font-display text-sm font-bold text-foreground leading-tight">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>

        <div className="flex flex-col gap-1">
          {actions.map((a) => (
            <button
              key={a.key}
              disabled={a.disabled}
              onClick={() => { if (!a.disabled) { a.onClick?.(); onClose(); } }}
              className={`text-left px-3 py-2 rounded-lg font-display text-sm font-bold transition-colors ${
                a.disabled
                  ? 'text-muted-foreground/60 cursor-not-allowed border border-border/30'
                  : 'text-foreground border border-divine/40 hover:bg-divine/15'
              }`}
            >
              <div>{a.label}</div>
              {(a.disabled ? a.reason : a.hint) && (
                <div className="text-xs font-normal text-muted-foreground mt-0.5">
                  {a.disabled ? a.reason : a.hint}
                </div>
              )}
            </button>
          ))}

          {actions.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground italic">
              {emptyMessage || 'Aucune action possible.'}
            </div>
          )}
        </div>

        {actions.length > 0 && enabled.length === 0 && (
          <div className="px-3 pt-2 text-xs text-muted-foreground italic">
            {emptyMessage || 'Aucune action possible pour le moment.'}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-2 px-3 py-1.5 rounded-lg font-display text-xs font-bold text-muted-foreground border border-border/40 hover:bg-secondary/50 transition-colors"
        >
          Fermer
        </button>
      </motion.div>
    </>,
    document.body,
  );
};

export default ActionBubble;
