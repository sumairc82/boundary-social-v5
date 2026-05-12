'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Rect { x: number; y: number; width: number; height: number; }

interface SelectedEl {
  el: HTMLElement;
  rect: Rect;
  origTransform: string;
  tx: number;
  ty: number;
}

interface Props {
  active: boolean;
  posterRef: React.RefObject<HTMLDivElement | null>;
}

// Elements that should NOT be selectable
const SKIP_CLASSES = ['poster', 'poster-inner', 'poster-bg-image'];
// Elements that make good selection targets (stop bubbling at these)
const TARGET_CLASSES = ['top', 'title-block', 'card', 'list', 'feature-grid', 'player-card', 'partner-card', 'footer', 'squad-layout', 'title', 'team', 'club', 'chips', 'crest', 'crest-lockup'];

export default function DesignStudio({ active, posterRef }: Props) {
  const [selected, setSelected] = useState<SelectedEl | null>(null);
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, tx: 0, ty: 0 });

  // Get rect of element relative to poster
  const getRelRect = useCallback((el: HTMLElement): Rect => {
    if (!posterRef.current) return { x: 0, y: 0, width: 0, height: 0 };
    const posterRect = posterRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return {
      x: elRect.left - posterRect.left,
      y: elRect.top - posterRect.top,
      width: elRect.width,
      height: elRect.height,
    };
  }, [posterRef]);

  // Handle click on poster to select element
  useEffect(() => {
    if (!active || !posterRef.current) {
      setSelected(null);
      return;
    }
    const poster = posterRef.current;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!poster.contains(target)) return;

      // Walk up from click target to find a good selection target
      let el: HTMLElement | null = target;
      while (el && el !== poster) {
        const skip = SKIP_CLASSES.some(c => el!.classList.contains(c));
        if (skip) { el = el.parentElement; continue; }
        const isTarget = TARGET_CLASSES.some(c => el!.classList.contains(c));
        if (isTarget) break;
        el = el.parentElement;
      }

      if (!el || el === poster) {
        setSelected(null);
        return;
      }

      const existing = el.style.transform || '';
      const match = existing.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
      const tx = match ? parseFloat(match[1]) : 0;
      const ty = match ? parseFloat(match[2]) : 0;

      setSelected({
        el,
        rect: getRelRect(el),
        origTransform: existing.replace(/translate\([^)]+\)/, '').trim(),
        tx, ty,
      });
    };

    poster.addEventListener('click', onClick);
    return () => poster.removeEventListener('click', onClick);
  }, [active, posterRef, getRelRect]);

  // Update rect on interval
  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(() => {
      if (selected.el) {
        setSelected(prev => prev ? { ...prev, rect: getRelRect(prev.el) } : null);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [selected, getRelRect]);

  // Mouse drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selected) return;
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, tx: selected.tx, ty: selected.ty };

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !selected) return;
      const dx = ev.clientX - dragStart.current.mx;
      const dy = ev.clientY - dragStart.current.my;
      const newTx = dragStart.current.tx + dx;
      const newTy = dragStart.current.ty + dy;
      selected.el.style.transform = `translate(${newTx}px, ${newTy}px) ${selected.origTransform}`.trim();
      setSelected(prev => prev ? { ...prev, tx: newTx, ty: newTy, rect: getRelRect(prev.el) } : null);
    };

    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [selected, getRelRect]);

  // Reset element position
  const onReset = useCallback(() => {
    if (!selected) return;
    selected.el.style.transform = selected.origTransform || '';
    setSelected(prev => prev ? { ...prev, tx: 0, ty: 0, rect: getRelRect(prev.el) } : null);
  }, [selected, getRelRect]);

  const onDeselect = useCallback(() => setSelected(null), []);

  if (!active) return null;

  return (
    <>
      {/* Hint banner */}
      {!selected && (
        <div style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(251,191,36,0.92)', color: '#000', fontSize: 11, fontWeight: 700,
          padding: '5px 14px', borderRadius: 20, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 100,
        }}>
          Click any element on the poster to select &amp; move it
        </div>
      )}

      {/* Selection box */}
      {selected && (
        <div style={{
          position: 'absolute',
          left: selected.rect.x - 3,
          top: selected.rect.y - 3,
          width: selected.rect.width + 6,
          height: selected.rect.height + 6,
          border: '2px solid #fbbf24',
          borderRadius: 4,
          pointerEvents: 'none',
          zIndex: 50,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
        }} />
      )}

      {/* Drag handle + controls */}
      {selected && (
        <div style={{
          position: 'absolute',
          left: selected.rect.x + selected.rect.width / 2 - 60,
          top: Math.max(0, selected.rect.y - 42),
          zIndex: 60,
          display: 'flex', gap: 4, alignItems: 'center',
          background: '#1a1e2c',
          border: '1px solid #fbbf24',
          borderRadius: 20,
          padding: '4px 8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        }}>
          <div
            onMouseDown={onMouseDown}
            style={{
              cursor: 'grab', padding: '4px 8px', fontSize: 14,
              userSelect: 'none', color: '#fbbf24',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            title="Drag to move"
          >
            ✛
            <span style={{ fontSize: 9, color: '#9099b5', fontWeight: 600 }}>DRAG</span>
          </div>
          <div style={{ width: 1, height: 16, background: '#2d3248' }} />
          <button onClick={onReset} title="Reset position"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#9099b5', padding: '2px 4px' }}>
            ↺
          </button>
          <button onClick={onDeselect} title="Deselect"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7494', padding: '2px 4px' }}>
            ✕
          </button>
        </div>
      )}
    </>
  );
}
