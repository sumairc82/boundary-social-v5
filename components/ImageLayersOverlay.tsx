'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { ImageLayer } from '@/lib/types';

interface Props {
  layers: ImageLayer[];
  onChange: (layers: ImageLayer[]) => void;
  posterRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
}

// 8 resize handle positions
const HANDLES = [
  { id: 'nw', cursor: 'nw-resize', style: { top: -5, left: -5 } },
  { id: 'n',  cursor: 'n-resize',  style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
  { id: 'ne', cursor: 'ne-resize', style: { top: -5, right: -5 } },
  { id: 'e',  cursor: 'e-resize',  style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
  { id: 'se', cursor: 'se-resize', style: { bottom: -5, right: -5 } },
  { id: 's',  cursor: 's-resize',  style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
  { id: 'sw', cursor: 'sw-resize', style: { bottom: -5, left: -5 } },
  { id: 'w',  cursor: 'w-resize',  style: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
] as const;

export default function ImageLayersOverlay({ layers, onChange, posterRef, zoom }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Cache natural aspect ratios per layer id
  const aspectCache = useRef<Record<string, number>>({});
  const [, forceUpdate] = useState(0);

  // Load natural dimensions for each layer
  useEffect(() => {
    layers.forEach(layer => {
      if (!aspectCache.current[layer.id]) {
        const img = new Image();
        img.onload = () => {
          aspectCache.current[layer.id] = img.naturalWidth / img.naturalHeight;
          forceUpdate(n => n + 1);
        };
        img.src = layer.dataUrl;
      }
    });
  }, [layers]);

  const update = useCallback((id: string, patch: Partial<ImageLayer>) => {
    onChange(layers.map(l => l.id === id ? { ...l, ...patch } : l));
  }, [layers, onChange]);

  const bringForward = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;
    const maxZ = Math.max(...layers.map(l => l.zIndex));
    if (layer.zIndex < maxZ) update(id, { zIndex: layer.zIndex + 1 });
  };
  const sendBack = (id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;
    const minZ = Math.min(...layers.map(l => l.zIndex));
    if (layer.zIndex > minZ) update(id, { zIndex: layer.zIndex - 1 });
  };

  // Drag to move
  const onDragStart = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedId(id);
    const poster = posterRef.current;
    if (!poster) return;
    const pr = poster.getBoundingClientRect();
    const pw = pr.width / zoom;
    const ph = pr.height / zoom;
    const startMx = e.clientX / zoom;
    const startMy = e.clientY / zoom;
    const layer = layers.find(l => l.id === id)!;
    const startX = layer.x, startY = layer.y;
    const layersSnap = layers; // snapshot at drag start

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX / zoom - startMx) / pw * 100;
      const dy = (ev.clientY / zoom - startMy) / ph * 100;
      // Use functional update with a ref-captured snapshot of layers at drag start
      onChange(layersSnap.map(l => l.id === id ? { ...l, x: startX + dx, y: startY + dy } : l));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [layers, onChange, posterRef, zoom]);

  // Drag to resize from any handle
  const onResizeStart = useCallback((e: React.MouseEvent, id: string, handleId: string) => {
    e.preventDefault(); e.stopPropagation();
    const poster = posterRef.current;
    if (!poster) return;
    const pr = poster.getBoundingClientRect();
    const pw = pr.width / zoom;
    const ph = pr.height / zoom;
    const layer = layers.find(l => l.id === id)!;
    const startMx = e.clientX / zoom;
    const startMy = e.clientY / zoom;
    const startScale = layer.scale;
    const layersSnap = layers; // snapshot at drag start

    // Choose axis based on handle: N/S = vertical, E/W/corners = horizontal
    const isVertical = handleId === 'n' || handleId === 's';
    // Direction: moving right/down = bigger, left/up = smaller
    const mult = (handleId === 'w' || handleId === 'nw' || handleId === 'sw' || handleId === 'n') ? -1 : 1;

    const onMove = (ev: MouseEvent) => {
      const delta = isVertical
        ? (ev.clientY / zoom - startMy)
        : (ev.clientX / zoom - startMx);
      const size = isVertical ? ph : pw;
      const newScale = Math.max(5, Math.min(200, startScale + mult * delta / size * 100));
      onChange(layersSnap.map(l => l.id === id ? { ...l, scale: Math.round(newScale) } : l));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [layers, onChange, posterRef, zoom]);

  const poster = posterRef.current;
  if (!poster) return null;
  const pr = poster.getBoundingClientRect();
  const pw = pr.width / zoom;
  const ph = pr.height / zoom;

  const selected = layers.find(l => l.id === selectedId);

  return (
    <>
      {/* Deselect when clicking empty area */}
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 9 }}
        onMouseDown={() => setSelectedId(null)}
      />

      {[...layers].sort((a, b) => a.zIndex - b.zIndex).map(layer => {
        const isSel = layer.id === selectedId;
        const aspect = aspectCache.current[layer.id] || 1;
        const imgW = pw * layer.scale / 100;
        const imgH = imgW / aspect;
        const left = pw * layer.x / 100 - imgW / 2;
        const top = ph * layer.y / 100 - imgH / 2;

        return (
          <div
            key={layer.id}
            data-img-layer
            onMouseDown={e => { e.stopPropagation(); onDragStart(e, layer.id); }}
            onClick={e => { e.stopPropagation(); setSelectedId(layer.id); }}
            style={{
              position: 'absolute',
              left, top,
              width: imgW,
              height: imgH,
              cursor: 'grab',
              zIndex: 10 + layer.zIndex,
              outline: isSel ? '2px solid #fbbf24' : '1px solid rgba(251,191,36,0.25)',
              outlineOffset: 1,
              userSelect: 'none',
              transform: layer.flipH ? 'scaleX(-1)' : undefined,
            }}
          >
            <img
              src={layer.dataUrl}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
              draggable={false}
            />

            {/* Resize handles — only when selected */}
            {isSel && HANDLES.map(h => (
              <div
                key={h.id}
                data-studio-ui
                onMouseDown={e => { e.stopPropagation(); onResizeStart(e, layer.id, h.id); }}
                style={{
                  position: 'absolute',
                  width: 10, height: 10,
                  background: '#fbbf24',
                  border: '2px solid #0f1120',
                  borderRadius: 2,
                  cursor: h.cursor,
                  zIndex: 20,
                  ...h.style as React.CSSProperties,
                }}
              />
            ))}
          </div>
        );
      })}

      {/* Floating toolbar for selected layer */}
      {selected && (() => {
        const aspect = aspectCache.current[selected.id] || 1;
        const imgW = pw * selected.scale / 100;
        const imgH = imgW / aspect;
        const left = pw * selected.x / 100 - imgW / 2;
        const top = ph * selected.y / 100 - imgH / 2;
        const toolbarTop = Math.max(0, top - 44);
        const toolbarLeft = Math.max(0, Math.min(left, pw - 220));

        return (
          <div
            data-studio-ui
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: toolbarLeft, top: toolbarTop,
              zIndex: 200,
              display: 'flex', gap: 2, alignItems: 'center',
              background: '#0f1120', border: '1.5px solid #fbbf24',
              borderRadius: 24, padding: '4px 10px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
              pointerEvents: 'auto', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700, marginRight: 4 }}>IMG</span>
            <input
              type="range" min={5} max={200} value={selected.scale}
              onChange={e => update(selected.id, { scale: +e.target.value })}
              style={{ width: 70, accentColor: '#fbbf24', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 9, color: '#8899bb', minWidth: 28 }}>{selected.scale}%</span>
            <div style={{ width: 1, height: 16, background: '#2d3248', margin: '0 3px' }} />
            <button onClick={() => update(selected.id, { flipH: !selected.flipH })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#8899bb', padding: '2px 4px' }} title="Flip horizontal">⇄</button>
            <button onClick={() => bringForward(selected.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#a0b0cc', padding: '2px 4px' }} title="Bring forward">▲</button>
            <button onClick={() => sendBack(selected.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#a0b0cc', padding: '2px 4px' }} title="Send back">▼</button>
            <div style={{ width: 1, height: 16, background: '#2d3248', margin: '0 3px' }} />
            <button onClick={() => { onChange(layers.filter(l => l.id !== selected.id)); setSelectedId(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444', padding: '2px 4px' }} title="Remove">✕</button>
          </div>
        );
      })()}
    </>
  );
}
