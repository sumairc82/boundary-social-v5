'use client';
import { useState, useRef, useCallback } from 'react';
import { ImageLayer } from '@/lib/types';

interface Props {
  layers: ImageLayer[];
  onChange: (layers: ImageLayer[]) => void;
  posterRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
}

export default function ImageLayersOverlay({ layers, onChange, posterRef, zoom }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragging = useRef(false);

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

  const onDragStart = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setSelectedId(id);
    dragging.current = true;
    const poster = posterRef.current;
    if (!poster) return;
    const pr = poster.getBoundingClientRect();
    const startMx = e.clientX, startMy = e.clientY;
    const layer = layers.find(l => l.id === id)!;
    const startX = layer.x, startY = layer.y;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const dx = ((ev.clientX - startMx) / zoom) / (pr.width / zoom) * 100;
      const dy = ((ev.clientY - startMy) / zoom) / (pr.height / zoom) * 100;
      onChange(layers.map(l => l.id === id ? { ...l, x: startX + dx, y: startY + dy } : l));
    };
    const onUp = () => { dragging.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
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
      {[...layers].sort((a,b) => a.zIndex - b.zIndex).map(layer => {
        const isSel = layer.id === selectedId;
        const imgW = pw * layer.scale / 100;
        const left = pw * layer.x / 100 - imgW / 2;
        const top = ph * layer.y / 100 - imgW / 2;

        return (
          <div key={layer.id}
            onMouseDown={e => onDragStart(e, layer.id)}
            onClick={e => { e.stopPropagation(); setSelectedId(layer.id); }}
            style={{
              position: 'absolute',
              left, top,
              width: imgW,
              cursor: 'grab',
              zIndex: 10 + layer.zIndex,
              outline: isSel ? '2px solid #fbbf24' : 'none',
              outlineOffset: 2,
              userSelect: 'none',
              transform: layer.flipH ? 'scaleX(-1)' : undefined,
            }}
          >
            <img src={layer.dataUrl} style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} draggable={false} />
          </div>
        );
      })}

      {/* Controls for selected layer */}
      {selected && (() => {
        const imgW = pw * selected.scale / 100;
        const left = pw * selected.x / 100 - imgW / 2;
        const top = ph * selected.y / 100 - imgW / 2;
        const toolbarTop = Math.max(0, top - 48);
        const toolbarLeft = Math.max(0, left);

        return (
          <div data-studio-ui onClick={e => e.stopPropagation()} style={{
            position: 'absolute', left: toolbarLeft, top: toolbarTop,
            zIndex: 200, display: 'flex', gap: 2, alignItems: 'center',
            background: '#0f1120', border: '1.5px solid #fbbf24',
            borderRadius: 24, padding: '4px 10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
            pointerEvents: 'auto', whiteSpace: 'nowrap',
          }}>
            <span style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700, marginRight: 4 }}>IMG</span>
            {/* Scale */}
            <input type="range" min={5} max={200} value={selected.scale}
              onChange={e => update(selected.id, { scale: +e.target.value })}
              style={{ width: 70, accentColor: '#fbbf24', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 9, color: '#8899bb', minWidth: 28 }}>{selected.scale}%</span>
            <div style={{ width:1, height:16, background:'#2d3248', margin:'0 3px' }} />
            {/* Flip */}
            <button onClick={() => update(selected.id, { flipH: !selected.flipH })}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#8899bb', padding:'2px 4px' }} title="Flip horizontal">⇄</button>
            {/* Z order */}
            <button onClick={() => bringForward(selected.id)}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#a0b0cc', padding:'2px 4px' }} title="Bring forward">▲</button>
            <button onClick={() => sendBack(selected.id)}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'#a0b0cc', padding:'2px 4px' }} title="Send back">▼</button>
            <div style={{ width:1, height:16, background:'#2d3248', margin:'0 3px' }} />
            {/* Delete */}
            <button onClick={() => { onChange(layers.filter(l => l.id !== selected.id)); setSelectedId(null); }}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#ef4444', padding:'2px 4px' }} title="Remove">✕</button>
          </div>
        );
      })()}
    </>
  );
}
