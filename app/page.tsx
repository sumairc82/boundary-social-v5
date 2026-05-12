'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AppState } from '@/lib/types';
import { DEFAULT_STATE } from '@/lib/defaults';
import { saveState, loadState } from '@/lib/storage';
import { exportPoster } from '@/lib/export';
import ControlPanel from '@/components/ControlPanel';
import RightPanel from '@/components/RightPanel';

const PosterRenderer = dynamic(() => import('@/components/PosterRenderer'), { ssr: false });

export default function Home() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadState();
    if (saved) setState(prev => ({ ...prev, ...saved }));
    setHydrated(true);
  }, []);

  const onChange = useCallback((patch: Partial<AppState>) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  const handleExport = async (pixelRatio = 3) => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      const slug = state.clubName.replace(/\s+/g, '-').toLowerCase();
      await exportPoster(posterRef.current, `${slug}-${state.template}.jpg`);
    } finally { setExporting(false); }
  };

  if (!hydrated) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090b11' }}>
      <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: 16, letterSpacing: '0.14em' }}>BOUNDARY SOCIAL</div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'#090b11', color:'#fff', fontFamily:'system-ui,-apple-system,sans-serif' }}>
      {/* Top bar */}
      <div style={{ height:44, background:'#111318', borderBottom:'1px solid #1e2233', display:'flex', alignItems:'center', padding:'0 16px', gap:12, flexShrink:0 }}>
        <span style={{ fontWeight:900, color:'#fbbf24', letterSpacing:'0.12em', fontSize:13 }}>BOUNDARY SOCIAL</span>
        <span style={{ width:1, height:18, background:'#2d3242' }} />
        <span style={{ fontSize:11, color:'#6b7494', textTransform:'capitalize' }}>{state.template.replace(/-/g,' ')}</span>
        <span style={{ fontSize:10, background:'#1a1e2c', color:'#4a5270', border:'1px solid #252d42', borderRadius:4, padding:'2px 7px', fontFamily:'monospace', textTransform:'uppercase' }}>
          style-{state.style}
        </span>
        <span style={{ fontSize:10, background:'#1a1e2c', color:'#4a5270', border:'1px solid #252d42', borderRadius:4, padding:'2px 7px', fontFamily:'monospace' }}>
          {state.palette}
        </span>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={() => handleExport(3)} disabled={exporting}
            style={{ fontSize:12, fontWeight:800, padding:'6px 16px', background:'#fbbf24', color:'#0a0a00', border:'none', borderRadius:7, cursor:'pointer', opacity: exporting?0.5:1, fontFamily:'inherit' }}>
            {exporting ? 'Exporting…' : 'Export JPG'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <ControlPanel state={state} onChange={onChange} />

        {/* Center canvas */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#090b11', overflow:'auto', padding:24 }}>
          <div style={{ boxShadow:'0 24px 80px rgba(0,0,0,0.7)', borderRadius:8 }}>
            <PosterRenderer ref={posterRef} state={state} />
          </div>
        </div>

        <RightPanel state={state} onChange={onChange} onExport={handleExport} exporting={exporting} />
      </div>
    </div>
  );
}
