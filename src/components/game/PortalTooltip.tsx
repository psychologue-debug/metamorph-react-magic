import { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalTooltipProps {
  /** Anchor point in viewport coordinates (e.g. the cursor position). */
  x: number;
  y: number;
  children: ReactNode;
}

/**
 * Renders its children in a fixed-position layer attached to <body>, above
 * everything else and never clipped by parent overflow. The bubble is offset
 * from the anchor and clamped so it always stays fully on screen, even when the
 * hovered element is at the edge or the viewport is small.
 */
const PortalTooltip = ({ x, y, children }: PortalTooltipProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ left: x, top: y, opacity: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 12;
    const offset = 18;

    let left = x + offset;
    if (left + rect.width + margin > window.innerWidth) left = x - rect.width - offset;
    if (left < margin) left = margin;
    left = Math.min(left, window.innerWidth - rect.width - margin);

    let top = y + offset;
    if (top + rect.height + margin > window.innerHeight) top = window.innerHeight - rect.height - margin;
    if (top < margin) top = margin;

    setStyle({ left, top, opacity: 1 });
  }, [x, y]);

  return createPortal(
    <div
      ref={ref}
      style={{ position: 'fixed', zIndex: 99999, pointerEvents: 'none', ...style }}
    >
      {children}
    </div>,
    document.body,
  );
};

export default PortalTooltip;
