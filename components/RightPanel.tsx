'use client';
import React, { useState } from 'react';
import { AppState } from '@/lib/types';
import { PALETTES } from '@/lib/palettes';
import { BG_STYLES } from '@/lib/bgStyles';
import { Download } from 'lucide-react';

const C = { panelBg:'#16181f', border:'#272b3a', activeBg:'#fbbf24', activeColor:'#0a0a00', btnBg:'#1e2130', btnBorder:'#2e3348', btnColor:'#7c87a6', title:'#5a6585', textSec:'#9099b5' };

interface Props { state: AppState; onChange: (p: Partial<AppState>) => void; onExport: (q: number) => void; exporting: boolean; }

export default function RightPanel({ state, onChange, onExport, exporting }: Props) {
  const [pixelRatio, setPixelRatio] = useState(3);

  const sectionTitle: React.CSSProperties = { fontSize:9, color:C.title, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 };

  return (
    <div style={{ width:230, minWidth:230, flexShrink:0, background:C.panelBg, borderLeft:`1px solid ${C.border}`, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:16 }}>

      {/* Aspect Ratio */}
      <div>
        <div style={sectionTitle}>Aspect Ratio</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:4 }}>
          {([
            { id:'story',     label:'9:16 Story' },
            { id:'fourfive',  label:'4:5 Post' },
            { id:'square',    label:'1:1 Square' },
            { id:'landscape', label:'16:9 Wide' },
          ] as const).map(r => (
            <button key={r.id} onClick={() => onChange({ratio: r.id})} style={{
              padding:'6px 4px', borderRadius:5, fontSize:9.5, fontWeight:600, textAlign:'center',
              cursor:'pointer', fontFamily:'inherit',
              background: state.ratio===r.id ? '#fbbf24' : '#161a26',
              border:`1px solid ${state.ratio===r.id ? '#fbbf24' : '#252d42'}`,
              color: state.ratio===r.id ? '#0a0a00' : '#6b7494',
            }}>{r.label}</button>
          ))}
        </div>
      </div>

      <div style={{ height:1, background:C.border }} />

      {/* Quick Styles */}
      <div>
        <div style={sectionTitle}>Quick Styles</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:3 }}>
          {BG_STYLES.slice(0,16).map(bg => (
            <button key={bg.id} onClick={() => onChange({style: bg.id as AppState['style']})} title={bg.name}
              style={{ aspectRatio:'4/5', borderRadius:3, overflow:'hidden', cursor:'pointer', padding:0,
                border:`2px solid ${state.style===bg.id ? C.activeBg : 'transparent'}`, transition:'all 0.1s' }}>
              <div className={`poster style-${bg.id} palette-${state.palette}`} style={{ width:'100%', height:'100%', display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:1, borderRadius:0 }}>
                <span style={{ fontSize:6, fontWeight:900, color:'rgba(255,255,255,0.8)', textShadow:'0 0 3px #000' }}>{bg.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height:1, background:C.border }} />

      {/* Quick Palettes */}
      <div>
        <div style={sectionTitle}>Palettes</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:3 }}>
          {PALETTES.map(p => (
            <button key={p.id} onClick={() => onChange({palette:p.id})} title={p.name}
              style={{ height:22, borderRadius:4, overflow:'hidden', cursor:'pointer', padding:0,
                border:`2px solid ${state.palette===p.id ? C.activeBg : 'transparent'}`, transition:'all 0.1s' }}>
              <div style={{ display:'flex', height:'100%' }}>
                <div style={{ flex:1, background:p.navy }} />
                <div style={{ flex:1, background:p.blue }} />
                <div style={{ flex:1, background:p.gold }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height:1, background:C.border }} />

      {/* Export */}
      <div>
        <div style={sectionTitle}>Export</div>
        <select value={pixelRatio} onChange={e => setPixelRatio(Number(e.target.value))}
          style={{ width:'100%', background:'#1e2130', border:`1px solid #2e3348`, borderRadius:6, padding:'7px 9px', fontSize:11, color:'#e8ecf4', outline:'none', cursor:'pointer', fontFamily:'inherit', marginBottom:8 }}>
          <option value={2}>Standard (2×) ~720px</option>
          <option value={3}>HD (3×) ~1080px</option>
          <option value={4}>Ultra (4×) ~1440px</option>
        </select>
        <button onClick={() => onExport(pixelRatio)} disabled={exporting}
          style={{ width:'100%', padding:'10px', background:C.activeBg, color:C.activeColor, fontWeight:900, fontSize:13, border:'none', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity: exporting ? 0.5 : 1, fontFamily:'inherit' }}>
          <Download size={16} />
          {exporting ? 'Exporting…' : 'Export JPG'}
        </button>
        <div style={{ fontSize:9, color:'#3a4260', textAlign:'center', marginTop:6 }}>
          360px × {pixelRatio}× scale
        </div>
      </div>
    </div>
  );
}
