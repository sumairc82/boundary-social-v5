'use client';
import React, { useState, useRef } from 'react';
import { AppState } from '@/lib/types';
import { SECTION_ORDERS } from '@/lib/defaults';

interface Props {
  state: AppState;
  onChange: (p: Partial<AppState>) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  header: 'Header',
  title: 'Title Block',
  fixtures: 'Fixtures',
  results: 'Results',
  players: 'Players',
  player: 'Player',
  squad: 'Squad',
  notice: 'Notice',
  sponsors: 'Sponsors',
  content: 'Content',
  footer: 'Footer',
};

const SECTION_ICON: Record<string, string> = {
  header: '🏷',
  title: '📝',
  fixtures: '📋',
  results: '📊',
  players: '👥',
  player: '👤',
  squad: '👥',
  notice: '📢',
  sponsors: '🤝',
  content: '📄',
  footer: '⚑',
};

const C = {
  bg: '#13161f',
  border: '#1e2234',
  rowBg: '#1a1d2c',
  rowHover: '#222638',
  activeRow: 'rgba(251,191,36,0.1)',
  text: '#c8d0e8',
  muted: '#4a5270',
  gold: '#fbbf24',
};

interface DragState {
  dragIdx: number;
  overIdx: number;
}

export default function LayersPanel({ state, onChange, isOpen, onToggle }: Props) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const dragHandleMouseDown = useRef<((e: MouseEvent) => void) | null>(null);

  const order = state.sectionOrder.length > 0 ? state.sectionOrder : (SECTION_ORDERS[state.template] || []);

  const handleDragStart = (idx: number) => {
    setDragState({ dragIdx: idx, overIdx: idx });
  };

  const handleDragOver = (idx: number) => {
    if (!dragState) return;
    setDragState(prev => prev ? { ...prev, overIdx: idx } : null);
  };

  const handleDrop = (idx: number) => {
    if (!dragState) return;
    const { dragIdx } = dragState;
    if (dragIdx === idx) { setDragState(null); return; }
    const newOrder = [...order];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    onChange({ sectionOrder: newOrder });
    setDragState(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
  };

  if (!isOpen) {
    return (
      <div style={{
        width: 0,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        transition: 'width 0.2s ease',
      }}>
        <button
          onClick={onToggle}
          style={{
            position: 'absolute',
            right: -14,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 14,
            height: 36,
            background: '#1a1d2c',
            border: '1px solid #272b3a',
            borderLeft: 'none',
            borderRadius: '0 6px 6px 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4a5270',
            fontSize: 10,
            zIndex: 10,
            padding: 0,
          }}
        >▶</button>
      </div>
    );
  }

  return (
    <div style={{
      width: 260,
      flexShrink: 0,
      background: C.bg,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'width 0.2s ease',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Layers
        </span>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: 'none',
            color: C.muted,
            cursor: 'pointer',
            fontSize: 12,
            padding: '2px 4px',
          }}
          title="Collapse layers panel"
        >◀</button>
      </div>

      {/* Layer list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {order.map((section, idx) => {
          const isDragging = dragState?.dragIdx === idx;
          const isOver = dragState?.overIdx === idx && dragState.dragIdx !== idx;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={`${section}-${idx}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={e => { e.preventDefault(); handleDragOver(idx); }}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 10px',
                cursor: 'grab',
                background: isDragging ? 'rgba(251,191,36,0.08)' : isOver ? 'rgba(251,191,36,0.06)' : isHovered ? C.rowHover : 'transparent',
                borderTop: isOver ? `2px solid ${C.gold}` : '2px solid transparent',
                opacity: isDragging ? 0.5 : 1,
                transition: 'background 0.1s',
                userSelect: 'none',
              }}
            >
              {/* Drag handle */}
              <span style={{ color: C.muted, fontSize: 11, flexShrink: 0, cursor: 'grab' }}>⠿</span>
              {/* Icon */}
              <span style={{ fontSize: 13, flexShrink: 0 }}>{SECTION_ICON[section] || '▪'}</span>
              {/* Label */}
              <span style={{ fontSize: 12, color: C.text, fontWeight: 600, flex: 1, fontFamily: 'system-ui,-apple-system,sans-serif' }}>
                {SECTION_LABELS[section] || section}
              </span>
              {/* Visibility toggle (decorative for now) */}
              <button
                onClick={e => { e.stopPropagation(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 13, padding: '0 2px', flexShrink: 0 }}
                title="Toggle visibility"
              >👁</button>
            </div>
          );
        })}
      </div>

      {/* Footer info */}
      <div style={{ padding: '6px 12px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <span style={{ fontSize: 9.5, color: C.muted }}>Drag rows to reorder sections</span>
      </div>
    </div>
  );
}
