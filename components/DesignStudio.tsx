'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Rect { x: number; y: number; width: number; height: number; }

interface SelectedEl {
  el: HTMLElement;
  rect: Rect;
  origTransform: string;
  origWidth: string;
  origHeight: string;
  tx: number;
  ty: number;
  w: number;
  h: number;
}

interface Props {
  active: boolean;
  posterRef: React.RefObject<HTMLDivElement | null>;
  zoom?: number;
}

const SKIP_CLASSES = ['poster', 'poster-bg-image', 'poster-inner'];
const TARGET_CLASSES = [
  'top', 'content', 'title-block', 'card', 'list', 'feature-grid',
  'player-card', 'partner-card', 'footer', 'squad-layout', 'title',
  'team', 'club', 'chips', 'crest', 'crest-lockup',
];

interface HandleDef { id: string; cursor: string; style: React.CSSProperties; }
const HS = 10;
const MID = `calc(50% - ${HS/2}px)`;
const HANDLES: HandleDef[] = [
  { id: 'nw', cursor: 'nw-resize', style: { left: -HS/2, top: -HS/2 } },
  { id: 'n',  cursor: 'n-resize',  style: { left: MID,   top: -HS/2 } },
  { id: 'ne', cursor: 'ne-resize', style: { right: -HS/2, top: -HS/2 } },
  { id: 'e',  cursor: 'e-resize',  style: { right: -HS/2, top: MID } },
  { id: 'se', cursor: 'se-resize', style: { right: -HS/2, bottom: -HS/2 } },
  { id: 's',  cursor: 's-resize',  style: { left: MID,    bottom: -HS/2 } },
  { id: 'sw', cursor: 'sw-resize', style: { left: -HS/2, bottom: -HS/2 } },
  { id: 'w',  cursor: 'w-resize',  style: { left: -HS/2, top: MID } },
];

export default function DesignStudio({ active, posterRef, zoom = 1 }: Props) {
  const [selected, setSelected] = useState<SelectedEl[]>([]);
  const dragging = useRef(false);
  const resizing = useRef<{ handle: string; startMx: number; startMy: number; origRect: Rect; origW: number; origH: number; origTx: number; origTy: number } | null>(null);
  const shiftHeld = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const getRelRect = useCallback((el: HTMLElement): Rect => {
    const poster = posterRef.current;
    if (!poster) return { x: 0, y: 0, width: 0, height: 0 };
    const pr = poster.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    return {
      x: (er.left - pr.left) / zoom,
      y: (er.top - pr.top) / zoom,
      width: er.width / zoom,
      height: er.height / zoom,
    };
  }, [posterRef, zoom]);

  useEffect(() => {
    const dn = (e: KeyboardEvent) => { shiftHeld.current = e.shiftKey; };
    const up = (e: KeyboardEvent) => { shiftHeld.current = e.shiftKey; };
    document.addEventListener('keydown', dn);
    document.addEventListener('keyup', up);
    return () => { document.removeEventListener('keydown', dn); document.removeEventListener('keyup', up); };
  }, []);

  // Clear selection when deactivated
  useEffect(() => { if (!active) setSelected([]); }, [active]);

  // Refresh rects
  useEffect(() => {
    if (!selected.length) return;
    const id = setInterval(() => {
      setSelected(prev => prev.map(s => ({ ...s, rect: getRelRect(s.el) })));
    }, 100);
    return () => clearInterval(id);
  }, [selected.length, getRelRect]);

  // The OVERLAY itself captures the click (pointerEvents:auto on parent),
  // then we use elementsFromPoint to find the poster element underneath
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    const poster = posterRef.current;
    if (!poster) return;

    // Ignore clicks on studio UI elements (handles, toolbar)
    const t = e.target as HTMLElement;
    if (t.closest('[data-studio-ui]')) return;

    // Find all elements at this viewport point, skip the overlay itself
    const elems = document.elementsFromPoint(e.clientX, e.clientY) as HTMLElement[];
    const posterEls = elems.filter(el =>
      poster.contains(el) &&
      !el.hasAttribute('data-studio-ui') &&
      !SKIP_CLASSES.some(c => el.classList.contains(c))
    );

    // Walk up from deepest element to find a TARGET_CLASS match
    let found: HTMLElement | null = null;
    for (const el of posterEls) {
      let cur: HTMLElement | null = el;
      while (cur && cur !== poster) {
        if (SKIP_CLASSES.some(c => cur!.classList.contains(c))) { cur = cur.parentElement; continue; }
        if (TARGET_CLASSES.some(c => cur!.classList.contains(c))) { found = cur; break; }
        cur = cur.parentElement;
      }
      if (found) break;
    }

    if (!found) { setSelected([]); return; }

    const existing = found.style.transform || '';
    const match = existing.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
    const tx = match ? parseFloat(match[1]) : 0;
    const ty = match ? parseFloat(match[2]) : 0;
    const origTransform = existing.replace(/translate\([^)]+\)/, '').trim();

    const newItem: SelectedEl = {
      el: found, rect: getRelRect(found),
      origTransform,
      origWidth: found.style.width || '',
      origHeight: found.style.height || '',
      tx, ty,
      w: parseFloat(found.style.width) || 0,
      h: parseFloat(found.style.height) || 0,
    };

    if (shiftHeld.current) {
      setSelected(prev => {
        const idx = prev.findIndex(s => s.el === found);
        return idx >= 0 ? prev.filter((_, i) => i !== idx) : [...prev, newItem];
      });
    } else {
      setSelected([newItem]);
    }
  }, [posterRef, getRelRect]);

  // ── DRAG ──
  const onDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selected.length) return;
    e.preventDefault(); e.stopPropagation();
    dragging.current = true;
    const startMx = e.clientX, startMy = e.clientY;
    const starts = selected.map(s => ({ tx: s.tx, ty: s.ty }));

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const dx = (ev.clientX - startMx) / zoom;
      const dy = (ev.clientY - startMy) / zoom;
      setSelected(prev => prev.map((s, i) => {
        const newTx = starts[i].tx + dx, newTy = starts[i].ty + dy;
        s.el.style.transform = `translate(${newTx}px,${newTy}px) ${s.origTransform}`.trim();
        return { ...s, tx: newTx, ty: newTy };
      }));
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [selected, zoom]);

  // ── RESIZE ──
  const onResizeMouseDown = useCallback((e: React.MouseEvent, handleId: string) => {
    if (selected.length !== 1) return;
    e.preventDefault(); e.stopPropagation();
    const s = selected[0];
    const origRect = { ...s.rect };
    const origW = s.w || s.rect.width;
    const origH = s.h || s.rect.height;
    resizing.current = { handle: handleId, startMx: e.clientX, startMy: e.clientY, origRect, origW, origH, origTx: s.tx, origTy: s.ty };

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const { handle, startMx, startMy, origW: oW, origH: oH, origTx: oTx, origTy: oTy } = resizing.current;
      const rawDx = (ev.clientX - startMx) / zoom;
      const rawDy = (ev.clientY - startMy) / zoom;
      let newW = oW, newH = oH, newTx = oTx, newTy = oTy;
      if (handle.includes('e')) newW = Math.max(40, oW + rawDx);
      if (handle.includes('w')) { newW = Math.max(40, oW - rawDx); newTx = oTx + rawDx; }
      if (handle.includes('s')) newH = Math.max(20, oH + rawDy);
      if (handle.includes('n')) { newH = Math.max(20, oH - rawDy); newTy = oTy + rawDy; }
      s.el.style.width = `${newW}px`;
      s.el.style.height = `${newH}px`;
      s.el.style.transform = `translate(${newTx}px,${newTy}px) ${s.origTransform}`.trim();
      setSelected(prev => prev.map(item =>
        item.el === s.el ? { ...item, w: newW, h: newH, tx: newTx, ty: newTy, rect: getRelRect(s.el) } : item
      ));
    };
    const onUp = () => {
      resizing.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [selected, zoom, getRelRect]);

  const onReset = useCallback(() => {
    setSelected(prev => prev.map(s => {
      s.el.style.transform = s.origTransform || '';
      s.el.style.width = s.origWidth;
      s.el.style.height = s.origHeight;
      return { ...s, tx: 0, ty: 0, w: 0, h: 0, rect: getRelRect(s.el) };
    }));
  }, [getRelRect]);

  if (!active) return null;

  const primary = selected[0] ?? null;

  return (
    // KEY CHANGE: overlay has pointer-events:auto so it CAPTURES clicks
    // then we use elementsFromPoint to find what's underneath
    <div
      ref={overlayRef}
      style={{ position: 'absolute', inset: 0, zIndex: 40, cursor: selected.length ? 'default' : 'crosshair' }}
      onClick={handleOverlayClick}
    >
      {/* Hint */}
      {!selected.length && (
        <div data-studio-ui style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(251,191,36,0.95)', color: '#000', fontSize: 11, fontWeight: 700,
          padding: '5px 16px', borderRadius: 20, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 100,
        }}>
          ✛ Click to select · Shift+Click multi · Drag ✛ to move · Corners to resize
        </div>
      )}

      {selected.length > 1 && (
        <div data-studio-ui style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(251,191,36,0.95)', color: '#000', fontSize: 11, fontWeight: 700,
          padding: '3px 12px', borderRadius: 20, pointerEvents: 'none', zIndex: 100,
        }}>
          {selected.length} selected
        </div>
      )}

      {selected.map((s, i) => (
        <div key={i} data-studio-ui style={{
          position: 'absolute',
          left: s.rect.x - 2, top: s.rect.y - 2,
          width: s.rect.width + 4, height: s.rect.height + 4,
          border: '2px solid #fbbf24',
          borderRadius: 3, pointerEvents: 'none', zIndex: 50,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
        }}>
          {i === 0 && HANDLES.map(h => (
            <div
              key={h.id}
              data-studio-ui
              onMouseDown={e => { e.stopPropagation(); onResizeMouseDown(e, h.id); }}
              style={{
                position: 'absolute', ...h.style,
                width: HS, height: HS,
                background: '#fff', border: '2px solid #fbbf24',
                borderRadius: 2, cursor: h.cursor,
                pointerEvents: 'auto', zIndex: 55,
                boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}
            />
          ))}
        </div>
      ))}

      {primary && (
        <div
          data-studio-ui
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: Math.max(0, primary.rect.x + primary.rect.width / 2 - 90),
            top: Math.max(0, primary.rect.y - 48),
            zIndex: 60, display: 'flex', gap: 2, alignItems: 'center',
            background: '#0f1120', border: '1.5px solid #fbbf24',
            borderRadius: 24, padding: '5px 10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
            pointerEvents: 'auto',
          }}
        >
          <div
            data-studio-ui
            onMouseDown={e => { e.stopPropagation(); onDragMouseDown(e); }}
            style={{
              cursor: 'grab', padding: '3px 8px', fontSize: 15,
              userSelect: 'none', color: '#fbbf24',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            ✛ <span style={{ fontSize: 9, color: '#8899bb', fontWeight: 700 }}>DRAG</span>
          </div>
          <div style={{ width: 1, height: 16, background: '#2d3248', margin: '0 2px' }} />
          <div style={{ fontSize: 9, color: '#5a6a8a', padding: '0 4px', fontFamily: 'monospace' }}>
            {Math.round(primary.rect.width)}×{Math.round(primary.rect.height)}
          </div>
          <div style={{ width: 1, height: 16, background: '#2d3248', margin: '0 2px' }} />
          <button
            data-studio-ui
            onClick={e => { e.stopPropagation(); onReset(); }}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#8899bb', padding:'2px 5px' }}>
            ↺
          </button>
          <button
            data-studio-ui
            onClick={e => { e.stopPropagation(); setSelected([]); }}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#6b7494', padding:'2px 5px' }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
