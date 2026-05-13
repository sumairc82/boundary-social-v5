'use client';
import React from 'react';

export type SidebarPanel = 'templates' | 'layers' | 'content' | 'style' | 'colours' | 'adjust' | 'sponsors' | 'background';

interface SidebarItem {
  id: SidebarPanel;
  label: string;
  icon: string;
}

const ITEMS: SidebarItem[] = [
  { id: 'templates',   label: 'Templates',   icon: '⊞' },
  { id: 'layers',      label: 'Layers',      icon: '≡' },
  { id: 'content',     label: 'Content',     icon: '✏' },
  { id: 'style',       label: 'Style',       icon: '🎨' },
  { id: 'colours',     label: 'Colours',     icon: '◑' },
  { id: 'adjust',      label: 'Adjust',      icon: '⊿' },
  { id: 'sponsors',    label: 'Sponsors',    icon: '🤝' },
  { id: 'background',  label: 'BG',          icon: '🖼' },
];

interface Props {
  active: SidebarPanel;
  onSelect: (panel: SidebarPanel) => void;
}

export default function IconSidebar({ active, onSelect }: Props) {
  return (
    <div style={{
      width: 60,
      flexShrink: 0,
      background: '#0d0f17',
      borderRight: '1px solid #1a1d2a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 8,
      gap: 2,
      overflow: 'hidden',
    }}>
      {ITEMS.map(item => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            title={item.label}
            style={{
              width: 52,
              padding: '8px 4px 6px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: isActive ? 'rgba(251,191,36,0.12)' : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              transition: 'background 0.15s',
            }}
          >
            <span style={{
              fontSize: 20,
              lineHeight: 1,
              color: isActive ? '#fbbf24' : '#6a7590',
            }}>{item.icon}</span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: isActive ? '#fbbf24' : '#5a6580',
              fontFamily: 'system-ui,-apple-system,sans-serif',
            }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
