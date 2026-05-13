'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AppState, TemplateId, ImageLayer } from '@/lib/types';
import { DEFAULT_STATE, SECTION_ORDERS } from '@/lib/defaults';
import { saveState, loadState } from '@/lib/storage';
import { exportPoster } from '@/lib/export';
import { PALETTES } from '@/lib/palettes';
import { BG_STYLES } from '@/lib/bgStyles';
import IconSidebar, { SidebarPanel } from '@/components/IconSidebar';
import LayersPanel from '@/components/LayersPanel';
const ImageLayersOverlay = dynamic(() => import('@/components/ImageLayersOverlay'), { ssr: false });

const PosterRenderer = dynamic(() => import('@/components/PosterRenderer'), { ssr: false });
const DesignStudio = dynamic(() => import('@/components/DesignStudio'), { ssr: false });

// ─── Colour constants ───
const C = {
  panelBg: '#1a1d27',
  border: '#2a2f42',
  inputBg: '#21253a',
  inputBorder: '#333a52',
  label: '#a8b4cc',
  sectionTitle: '#7b89a8',
  text: '#eef1f8',
  textSec: '#b0bace',
  gold: '#fbbf24',
  goldText: '#0a0a00',
  btnBg: '#21253a',
  btnBorder: '#333a52',
  btnColor: '#a8b4cc',
  subCard: '#14172000',
};

const S = {
  input: {
    width: '100%', background: C.inputBg, border: `1px solid ${C.inputBorder}`,
    borderRadius: 6, padding: '8px 10px', fontSize: 13, color: C.text,
    outline: 'none', fontFamily: 'inherit',
  } as React.CSSProperties,
  label: { fontSize: 12, color: C.label, fontWeight: 600, display: 'block', marginBottom: 5 } as React.CSSProperties,
  secTitle: {
    fontSize: 10, color: C.sectionTitle, fontWeight: 700,
    textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8,
    background: '#1e2235', padding: '6px 8px', borderRadius: 4,
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  divider: { height: 1, background: C.border, margin: '10px 0' },
};

// ─── Reusable small components ───
function Field({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  return (
    <div style={S.field}>
      {label && <label style={S.label}>{label}</label>}
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          rows={3} style={{ ...S.input, resize: 'vertical' as const, minHeight: 64 }} />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} style={S.input} />
      )}
    </div>
  );
}

function SliderField({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: C.textSec }}>{label}</span>
        <span style={{ fontSize: 10, color: C.gold, fontFamily: 'monospace', fontWeight: 700 }}>{value}{label.includes('Scale') ? '%' : ''}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: C.gold, cursor: 'pointer' }} />
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 30, height: 30, borderRadius: 6, border: `2px solid ${C.inputBorder}`, overflow: 'hidden', flexShrink: 0 }}>
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
          style={{ width: '200%', height: '200%', border: 'none', cursor: 'pointer', transform: 'translate(-25%,-25%)' }} />
      </div>
      <span style={{ fontSize: 11, color: C.textSec }}>{label}</span>
    </div>
  );
}

function UploadZone({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handle = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => onChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      {label && <label style={S.label}>{label}</label>}
      <div onClick={() => ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
        style={{
          border: `2px dashed ${C.inputBorder}`, borderRadius: 8, padding: 14,
          textAlign: 'center', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
        {value ? <img src={value} style={{ maxHeight: 56, objectFit: 'contain' }} alt="" /> :
          <>
            <span style={{ fontSize: 20 }}>🖼️</span>
            <span style={{ fontSize: 11, color: C.label }}>Drop or click to upload</span>
          </>}
      </div>
      {value && <button onClick={() => onChange('')}
        style={{ marginTop: 4, fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>}
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
    </div>
  );
}

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'matchday', label: 'Match Day' },
  { id: 'results', label: 'Results' },
  { id: 'performer', label: 'Performer' },
  { id: 'signing', label: 'Signing' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'squad', label: 'Squad' },
  { id: 'notice', label: 'Notice' },
  { id: 'sponsor', label: 'Sponsor' },
  { id: 'custom', label: 'Custom' },
];

// ─── Content Fields panel (reusable across tabs) ───
function ContentFields({ state, onChange }: { state: AppState; onChange: (p: Partial<AppState>) => void }) {
  const updateDetail = (i: number, v: string) => {
    const d = [...(state.details || ['','','','',''])]; d[i] = v; onChange({ details: d });
  };
  const updateFixture = (i: number, k: string, v: string) => {
    const f = [...state.fixtures]; f[i] = { ...f[i], [k]: v }; onChange({ fixtures: f });
  };
  const updateResult = (i: number, k: string, v: string) => {
    const r = [...state.results]; r[i] = { ...r[i], [k]: v } as typeof r[0]; onChange({ results: r });
  };
  const updatePlayer = (i: number, k: string, v: string) => {
    const p = [...state.players]; p[i] = { ...p[i], [k]: v }; onChange({ players: p });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={S.secTitle}>Title</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Field label="Title Line 1" value={state.titleTop} onChange={v => onChange({ titleTop: v })} placeholder="MATCH" />
          <Field label="Title Line 2 (gold)" value={state.titleBottom} onChange={v => onChange({ titleBottom: v })} placeholder="DAY" />
          <Field label="Tournament / Badge" value={state.tournamentText} onChange={v => onChange({ tournamentText: v })} placeholder="Premier Division" />
        </div>
      </div>
      <div style={S.divider} />

      {(state.template === 'matchday' || state.template === 'custom') && (
        <div>
          <div style={S.secTitle}>Match Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Field label="Home Team" value={state.matchHome} onChange={v => onChange({ matchHome: v })} />
            <Field label="Away Team" value={state.matchAway} onChange={v => onChange({ matchAway: v })} />
            <Field label="Date" value={state.matchDate} onChange={v => onChange({ matchDate: v })} />
            <Field label="Time" value={state.matchTime} onChange={v => onChange({ matchTime: v })} />
            <Field label="Venue" value={state.matchVenue} onChange={v => onChange({ matchVenue: v })} />
            <div style={S.secTitle}>Detail Tiles</div>
            {[0,1,2,3].map(i => (
              <Field key={i} label={`Tile ${i+1}`} value={state.details?.[i]||''} onChange={v => updateDetail(i,v)} />
            ))}
          </div>
        </div>
      )}

      {state.template === 'results' && (
        <div>
          <div style={S.secTitle}>Results</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: C.textSec }}>Show:</span>
            {[1,2,3,4].map(n => (
              <button key={n} onClick={() => onChange({ resultCount: n })} style={{
                width: 26, height: 26, borderRadius: 5, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                background: state.resultCount === n ? C.gold : C.btnBg,
                border: `1px solid ${state.resultCount === n ? C.gold : C.btnBorder}`,
                color: state.resultCount === n ? C.goldText : C.btnColor,
              }}>{n}</button>
            ))}
          </div>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ background: C.subCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, marginBottom: 8 }}>Result {i+1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={S.field}>
                  <label style={S.label}>Outcome</label>
                  <select value={state.results[i]?.outcome||'W'} onChange={e => updateResult(i,'outcome',e.target.value)} style={{ ...S.input }}>
                    <option value="W">W — Win</option>
                    <option value="L">L — Loss</option>
                    <option value="NR">NR — No Result</option>
                  </select>
                </div>
                <Field label="Innings 1" value={state.results[i]?.innings1||''} onChange={v => updateResult(i,'innings1',v)} placeholder="Riverside 187/4 (35)" />
                <Field label="Innings 2" value={state.results[i]?.innings2||''} onChange={v => updateResult(i,'innings2',v)} placeholder="Valley 143 ao (32)" />
                <Field label="Result Line" value={state.results[i]?.resultLine||''} onChange={v => updateResult(i,'resultLine',v)} placeholder="Won by 44 runs" />
              </div>
            </div>
          ))}
        </div>
      )}

      {state.template === 'performer' && (
        <div>
          <div style={S.secTitle}>Players</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: C.textSec }}>Count:</span>
            {[1,2,3,4].map(n => (
              <button key={n} onClick={() => onChange({ playerCount: n })} style={{
                width: 26, height: 26, borderRadius: 5, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                background: state.playerCount === n ? C.gold : C.btnBg,
                border: `1px solid ${state.playerCount === n ? C.gold : C.btnBorder}`,
                color: state.playerCount === n ? C.goldText : C.btnColor,
              }}>{n}</button>
            ))}
          </div>
          {Array.from({length: state.playerCount}).map((_,i) => (
            <div key={i} style={{ background: C.subCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, marginBottom: 8 }}>Player {i+1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Field label="Name" value={state.players[i]?.name||''} onChange={v => updatePlayer(i,'name',v)} />
                <Field label="Role" value={state.players[i]?.role||''} onChange={v => updatePlayer(i,'role',v)} />
                <Field label="Stat / Note" value={state.players[i]?.stat||''} onChange={v => updatePlayer(i,'stat',v)} />
                <UploadZone label="Photo" value={state.players[i]?.photoDataUrl||''} onChange={v => updatePlayer(i,'photoDataUrl',v)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {state.template === 'signing' && (
        <div>
          <div style={S.secTitle}>New Signing</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Field label="Player Name" value={state.signingName} onChange={v => onChange({ signingName: v })} />
            <Field label="Role" value={state.signingRole} onChange={v => onChange({ signingRole: v })} />
            <Field label="Note / Stat" value={state.signingNote} onChange={v => onChange({ signingNote: v })} />
            <UploadZone label="Photo" value={state.signingPhotoDataUrl} onChange={v => onChange({ signingPhotoDataUrl: v })} />
          </div>
        </div>
      )}

      {(state.template === 'weekend' || state.template === 'monthly') && (
        <div>
          <div style={S.secTitle}>Fixtures (up to 5)</div>
          {/* Paste importer */}
          <div style={{ background:'#12141c', border:'1px dashed #fbbf2466', borderRadius:8, padding:10, marginBottom:10 }}>
            <div style={{ fontSize:11, color:C.gold, fontWeight:700, marginBottom:4 }}>📋 Paste Fixtures</div>
            <div style={{ fontSize:10, color:C.textSec, marginBottom:6 }}>Paste rows copied from a spreadsheet (Date, Start, Home, Away, Competition, Ground, Team, Division)</div>
            <textarea rows={4} placeholder={'09 May 2026\t12:00\tBurnham CC\tUxbridge CC\tDivision 1\tThe Ground\t1st XI\tDiv 1'}
              style={{ ...S.input, resize:'vertical', minHeight:72, fontFamily:'monospace', fontSize:10 }}
              onPaste={e => {
                setTimeout(() => {
                  const text = (e.target as HTMLTextAreaElement).value.trim();
                  const rows = text.split('\n').filter(r => r.trim());
                  const parsed = rows.map(row => {
                    const cols = row.split('\t');
                    // skip header row
                    if (cols[0]?.toLowerCase().includes('date')) return null;
                    const date = cols[0]?.trim() || '';
                    const time = cols[1]?.trim() || '';
                    const home = cols[2]?.trim() || '';
                    const away = cols[3]?.trim() || '';
                    const team = cols[6]?.trim() || cols[4]?.trim() || '';
                    const venue = cols[5]?.trim() || '';
                    return { badge: team, homeTeam: home, awayTeam: away, time, date, venue };
                  }).filter(Boolean) as AppState['fixtures'];
                  if (parsed.length) {
                    onChange({ fixtures: parsed.slice(0, 5) });
                    (e.target as HTMLTextAreaElement).value = `✓ Imported ${parsed.length} fixture${parsed.length>1?'s':''}`;
                  }
                }, 50);
              }}
            />
          </div>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ background: C.subCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, marginBottom: 8 }}>Fixture {i+1}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Field label="Badge/XI" value={state.fixtures[i]?.badge||''} onChange={v => updateFixture(i,'badge',v)} placeholder="1st XI" />
                <Field label="Home Team" value={state.fixtures[i]?.homeTeam||''} onChange={v => updateFixture(i,'homeTeam',v)} />
                <Field label="Away Team" value={state.fixtures[i]?.awayTeam||''} onChange={v => updateFixture(i,'awayTeam',v)} />
                <Field label="Time" value={state.fixtures[i]?.time||''} onChange={v => updateFixture(i,'time',v)} placeholder="1:00pm" />
                <Field label="Date" value={state.fixtures[i]?.date||''} onChange={v => updateFixture(i,'date',v)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {state.template === 'squad' && (
        <div>
          <div style={S.secTitle}>Squad Players</div>
          {Array.from({length: Math.min(state.squadPlayers.length + 1, 14)}).map((_, i) => (
            <div key={i} style={{ background: C.subCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, marginBottom: 6 }}>#{i+1}</div>
              <input type="text"
                value={state.squadPlayers[i]?.name || ''}
                placeholder={`Player ${i+1}`}
                onChange={e => {
                  const p = [...state.squadPlayers];
                  p[i] = { name: e.target.value, photoDataUrl: p[i]?.photoDataUrl || '' };
                  onChange({ squadPlayers: p });
                }}
                style={S.input} />
            </div>
          ))}
        </div>
      )}

      {state.template === 'notice' && (
        <div>
          <div style={S.secTitle}>Notice Text</div>
          <Field label="" value={state.noticeText} onChange={v => onChange({ noticeText: v })} multiline />
        </div>
      )}
    </div>
  );
}

// ─── Sponsors panel ───
function SponsorsPanel({ state, onChange }: { state: AppState; onChange: (p: Partial<AppState>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={S.secTitle}>Sponsors</div>
      <div style={S.field}>
        <label style={S.label}>Layout</label>
        <select value={state.sponsorLayout} onChange={e => onChange({sponsorLayout: e.target.value as AppState['sponsorLayout']})} style={S.input}>
          <option value="featured">Auto grid (adapts to count)</option>
          <option value="compact">Compact 6-per-row grid</option>
          <option value="row">Single row</option>
          <option value="centred">Centred wrap</option>
          <option value="left">Left aligned wrap</option>
          <option value="stacked">Stacked full width</option>
        </select>
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
        <input type="checkbox" checked={state.sponsorNoBg||false} onChange={e => onChange({sponsorNoBg:e.target.checked})} />
        <span style={{ fontSize:11, color:C.textSec }}>Transparent sponsor tiles</span>
      </label>
      {/* Multi-file logo upload */}
      <div style={{ background:'#12141c', border:'1px dashed #fbbf2466', borderRadius:8, padding:12, textAlign:'center' }}>
        <div style={{ fontSize:11, color:C.gold, fontWeight:700, marginBottom:4 }}>Upload Multiple Sponsor Logos</div>
        <div style={{ fontSize:10, color:C.textSec, marginBottom:8 }}>Select multiple image files at once</div>
        <label style={{ cursor:'pointer', display:'inline-block', background:'#21253a', border:'1px solid #fbbf24', borderRadius:6, padding:'6px 16px', fontSize:11, color:C.gold, fontWeight:700 }}>
          Choose Files
          <input type="file" accept="image/*" multiple style={{ display:'none' }}
            onChange={e => {
              const files = Array.from(e.target.files || []);
              if (!files.length) return;
              const newSponsors: { name: string; logo: string }[] = [];
              let loaded = 0;
              files.forEach((file, idx) => {
                const reader = new FileReader();
                reader.onload = ev => {
                  newSponsors[idx] = { name: file.name.replace(/\.[^.]+$/, ''), logo: ev.target?.result as string };
                  loaded++;
                  if (loaded === files.length) {
                    onChange({ sponsors: [...state.sponsors, ...newSponsors.filter(Boolean)] });
                  }
                };
                reader.readAsDataURL(file);
              });
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {state.sponsors.map((sp, i) => (
        <div key={i} style={{ background: C.subCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: C.gold, fontWeight: 700 }}>Sponsor {i+1}</span>
            <button onClick={() => onChange({ sponsors: state.sponsors.filter((_,j)=>j!==i) })}
              style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
          </div>
          <Field label="Name" value={sp.name} onChange={v => { const ss=[...state.sponsors]; ss[i]={...ss[i],name:v}; onChange({sponsors:ss}); }} />
          <div style={{ marginTop: 6 }}>
            <UploadZone label="Logo" value={sp.logo} onChange={v => { const ss=[...state.sponsors]; ss[i]={...ss[i],logo:v}; onChange({sponsors:ss}); }} />
          </div>
        </div>
      ))}
      <button onClick={() => onChange({ sponsors: [...state.sponsors, { name: '', logo: '' }] })}
        style={{ width: '100%', padding: '8px', background: C.btnBg, border: `1px dashed ${C.btnBorder}`, borderRadius: 7, fontSize: 12, color: C.textSec, cursor: 'pointer', fontFamily: 'inherit' }}>
        + Add Sponsor
      </button>
    </div>
  );
}

// ─── Adjust Panel (shared between left sidebar and right panel) ───
function AdjustPanelContent({ state, onChange }: { state: AppState; onChange: (p: Partial<AppState>) => void }) {
  const fixtureTemplates: AppState['template'][] = ['matchday','results','weekend','squad','custom','monthly'];
  const resetAll = () => onChange({
    titleScale:100, titleTopScale:100, titleBotScale:100, headlineX:0, headlineY:0,
    headlineSpacing:100, detailScale:100, metaScale:100, fixtureScale:100, badgeScale:100,
    sponsorScale:100, logoScale:100, logoX:0, logoY:0, topSpacing:0,
    contentY:0, contentX:0, contentScale:100,
  });
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'12px 12px' }}>
      {/* Reset all + template badge */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:10, color:'#fbbf24', fontWeight:700, background:'#1e2235', padding:'3px 8px', borderRadius:4 }}>
          {state.template.replace(/-/g,' ').toUpperCase()}
        </div>
        <button onClick={resetAll}
          style={{ fontSize:10, color:'#ef4444', background:'none', border:'1px solid #3a1a1a', borderRadius:5, padding:'3px 8px', cursor:'pointer', fontFamily:'inherit' }}>
          ↺ Reset All
        </button>
      </div>

      {/* Header toggle */}
      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'6px 8px', background:'#1e2235', borderRadius:6 }}>
        <input type="checkbox" checked={state.showHeader !== false} onChange={e => onChange({showHeader:e.target.checked})} />
        <span style={{ fontSize:12, color:'#b0bcd4', fontWeight:600 }}>Show Club Header Bar</span>
      </label>

      <div style={S.divider} />
      <div style={S.secTitle}>Poster Font Sizes</div>
      <SliderField label="Headline Size" value={state.titleScale} min={50} max={200} onChange={v => onChange({titleScale:v})} />
      <SliderField label="Headline Top Size" value={state.titleTopScale ?? 100} min={50} max={200} onChange={v => onChange({titleTopScale:v})} />
      <SliderField label="Headline Bottom Size" value={state.titleBotScale ?? 100} min={50} max={200} onChange={v => onChange({titleBotScale:v})} />
      <SliderField label="Details Text Size" value={state.detailScale ?? 100} min={50} max={200} onChange={v => onChange({detailScale:v})} />
      <SliderField label="Meta Text Size" value={state.metaScale} min={50} max={200} onChange={v => onChange({metaScale:v})} />

      {fixtureTemplates.includes(state.template) && (
        <>
          <div style={S.divider} />
          <div style={S.secTitle}>Fixture Sizes</div>
          <SliderField label="Fixture Scale" value={state.fixtureScale} min={50} max={200} onChange={v => onChange({fixtureScale:v})} />
          <SliderField label="Badge Scale" value={state.badgeScale} min={50} max={200} onChange={v => onChange({badgeScale:v})} />
        </>
      )}

      <div style={S.divider} />
      <div style={S.secTitle}>Content Section Position &amp; Size</div>
      <SliderField label="Up / Down" value={state.contentY ?? 0} min={-300} max={300} onChange={v => onChange({contentY:v})} />
      <SliderField label="Left / Right" value={state.contentX ?? 0} min={-300} max={300} onChange={v => onChange({contentX:v})} />
      <SliderField label="Scale" value={state.contentScale ?? 100} min={50} max={200} onChange={v => onChange({contentScale:v})} />
      <button onClick={() => onChange({contentY:0, contentX:0, contentScale:100})}
        style={{ fontSize:10, color:'#fbbf24', background:'#1e2235', border:'1px solid #2d3248', borderRadius:5, padding:'4px 8px', cursor:'pointer', fontFamily:'inherit', alignSelf:'flex-start' }}>
        ↺ Reset Content
      </button>

      <div style={S.divider} />
      <div style={S.secTitle}>Poster Padding</div>
      <SliderField label="Top" value={state.padTop ?? 0} min={0} max={80} onChange={v => onChange({padTop:v})} />
      <SliderField label="Bottom" value={state.padBottom ?? 0} min={0} max={80} onChange={v => onChange({padBottom:v})} />
      <SliderField label="Left" value={state.padLeft ?? 0} min={0} max={80} onChange={v => onChange({padLeft:v})} />
      <SliderField label="Right" value={state.padRight ?? 0} min={0} max={80} onChange={v => onChange({padRight:v})} />
      <button onClick={() => onChange({padTop:0,padBottom:0,padLeft:0,padRight:0})}
        style={{ fontSize:10, color:'#fbbf24', background:'#1e2235', border:'1px solid #2d3248', borderRadius:5, padding:'4px 8px', cursor:'pointer', fontFamily:'inherit', alignSelf:'flex-start' }}>
        ↺ Reset Padding
      </button>

      <div style={S.divider} />
      <div style={S.secTitle}>Headline Position</div>
      <SliderField label="Headline Left / Right" value={state.headlineX ?? 0} min={-160} max={160} onChange={v => onChange({headlineX:v})} />
      <SliderField label="Headline Up / Down" value={state.headlineY ?? 0} min={-160} max={160} onChange={v => onChange({headlineY:v})} />
      <SliderField label="Headline Spacing" value={state.headlineSpacing ?? 100} min={50} max={200} onChange={v => onChange({headlineSpacing:v})} />
      <button onClick={() => onChange({headlineX:0,headlineY:0,headlineSpacing:100})}
        style={{ fontSize:10, color:'#fbbf24', background:'#1e2235', border:'1px solid #2d3248', borderRadius:5, padding:'4px 8px', cursor:'pointer', fontFamily:'inherit', alignSelf:'flex-start' }}>
        ↺ Reset Headline
      </button>

      <div style={S.divider} />
      <div style={S.secTitle}>Club Logo Size &amp; Position</div>
      <SliderField label="Club Logo Size" value={state.logoScale} min={20} max={200} onChange={v => onChange({logoScale:v})} />
      <SliderField label="Club Logo Left / Right" value={state.logoX ?? 0} min={-260} max={260} onChange={v => onChange({logoX:v})} />
      <SliderField label="Club Logo Up / Down" value={state.logoY ?? 0} min={-100} max={100} onChange={v => onChange({logoY:v})} />
      <button onClick={() => onChange({logoX:0,logoY:0,logoScale:100})}
        style={{ fontSize:10, color:'#fbbf24', background:'#1e2235', border:'1px solid #2d3248', borderRadius:5, padding:'4px 8px', cursor:'pointer', fontFamily:'inherit', alignSelf:'flex-start' }}>
        ↺ Reset Logo
      </button>

      {state.sponsors.length > 0 && (
        <>
          <div style={S.divider} />
          <div style={S.secTitle}>Sponsor Tiles</div>
          <SliderField label="Overall Scale" value={state.sponsorScale} min={35} max={200} onChange={v => onChange({sponsorScale:v})} />
          <SliderField label="Tile Height (px)" value={state.sponsorHeight ?? 0} min={0} max={120} onChange={v => onChange({sponsorHeight:v})} />
          <div style={{ fontSize:9, color:'#5a6a8a' }}>0 = auto height</div>
        </>
      )}

      <div style={S.divider} />
      <div style={S.secTitle}>Top Spacing</div>
      <SliderField label="Top Spacing" value={state.topSpacing} min={0} max={34} onChange={v => onChange({topSpacing:v})} />

      <div style={S.divider} />
      <div style={S.secTitle}>Background Image</div>
      <UploadZone label="" value={state.bgImageDataUrl} onChange={v => onChange({ bgImageDataUrl: v })} />
      {state.bgImageDataUrl && (
        <>
          <SliderField label="Transparency" value={state.bgOpacity} min={0} max={100} onChange={v => onChange({bgOpacity:v})} />
          <SliderField label="Size" value={state.bgSize} min={10} max={300} onChange={v => onChange({bgSize:v})} />
          <SliderField label="Position X" value={state.bgPosX} min={0} max={100} onChange={v => onChange({bgPosX:v})} />
          <SliderField label="Position Y" value={state.bgPosY} min={0} max={100} onChange={v => onChange({bgPosY:v})} />
        </>
      )}

      {(state.bgImageDataUrl || state.players.some(p => p.photoDataUrl) || state.signingPhotoDataUrl) && (
        <>
          <div style={S.divider} />
          <div style={S.secTitle}>Photo Filters</div>
          <SliderField label="Brightness" value={state.mediaBrightness} min={50} max={200} onChange={v => onChange({mediaBrightness:v})} />
          <SliderField label="Contrast" value={state.mediaContrast} min={50} max={200} onChange={v => onChange({mediaContrast:v})} />
          <SliderField label="Vibrance" value={state.mediaSaturate} min={0} max={200} onChange={v => onChange({mediaSaturate:v})} />
        </>
      )}
    </div>
  );
}

// ─── Main App ───
export default function Home() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [studioMode, setStudioMode] = useState(false);
  const [activePanel, setActivePanel] = useState<SidebarPanel>('layers');
  const [layersOpen, setLayersOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [rightTab, setRightTab] = useState<'design' | 'style' | 'adjust' | 'export'>('design');
  const [pixelRatio, setPixelRatio] = useState(3);
  const [zoom, setZoom] = useState(1.0);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadState();
    // Merge with DEFAULT_STATE first so new fields always have fallback values
    if (saved) setState(() => ({ ...DEFAULT_STATE, ...saved }));
    setHydrated(true);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); setZoom(z => Math.min(2.0, +(z + 0.1).toFixed(2))); }
        if (e.key === '-') { e.preventDefault(); setZoom(z => Math.max(0.25, +(z - 0.1).toFixed(2))); }
        if (e.key === '0') { e.preventDefault(); setZoom(1.0); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const onChange = useCallback((patch: Partial<AppState>) => {
    setState(prev => {
      // When template changes, reset sectionOrder AND position overrides
      if (patch.template && patch.template !== prev.template) {
        patch.sectionOrder = SECTION_ORDERS[patch.template] || [];
        patch.headlineX = 0; patch.headlineY = 0; patch.headlineSpacing = 100;
        patch.contentX = 0; patch.contentY = 0; patch.contentScale = 100;
        // Per-template default titles
        const titles: Record<string, [string,string]> = {
          matchday:  ['MATCH',   'DAY'],
          results:   ['MATCH',   'RESULTS'],
          performer: ['PLAYER',  'SPOTLIGHT'],
          signing:   ['NEW',     'SIGNING'],
          weekend:   ['THIS',    'WEEKEND'],
          squad:     ['SQUAD',   'ANNOUNCEMENT'],
          sponsor:   ['THANK',   'OUR SPONSORS'],
          notice:    ['CLUB',    'NOTICE'],
          custom:    ['',        ''],
          monthly:   ['MONTHLY', 'FIXTURES'],
        };
        const [top, bot] = titles[patch.template] || ['',''];
        patch.titleTop = top;
        patch.titleBottom = bot;
      }
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  const handleExport = async (pr = pixelRatio) => {
    if (!posterRef.current) return;
    setExporting(true);
    try {
      const slug = state.clubName.replace(/\s+/g, '-').toLowerCase();
      await exportPoster(posterRef.current, `${slug}-${state.template}.jpg`, pr);
    } finally { setExporting(false); }
  };

  if (!hydrated) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117' }}>
      <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: 16, letterSpacing: '0.14em' }}>BOUNDARY SOCIAL</div>
    </div>
  );

  // ── Left panel content based on active sidebar icon ──
  const renderLeftPanelContent = () => {
    switch (activePanel) {
      case 'templates':
        return (
          <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={S.secTitle}>Template</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => onChange({ template: t.id })} style={{
                  padding: '8px 4px', borderRadius: 6, fontSize: 11, textAlign: 'center',
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: state.template === t.id ? C.gold : C.btnBg,
                  border: `1px solid ${state.template === t.id ? C.gold : C.btnBorder}`,
                  color: state.template === t.id ? C.goldText : C.btnColor,
                  fontWeight: state.template === t.id ? 800 : 600,
                }}>{t.label}</button>
              ))}
            </div>
            {state.template === 'performer' && (
              <>
                <div style={S.divider} />
                <div style={S.secTitle}>Performer Layout</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {([
                    { id: '4-player', label: '4 Players (stacked)' },
                    { id: '3-player', label: '3 Players' },
                    { id: '2-player', label: '2 Players (large)' },
                    { id: '2-player-large', label: '2 Players (full-width)' },
                    { id: '1-player-hero', label: '1 Player (hero)' },
                  ] as const).map(l => (
                    <button key={l.id} onClick={() => {
                      const countMap: Record<string,number> = {'4-player':4,'3-player':3,'2-player':2,'2-player-large':2,'1-player-hero':1};
                      onChange({ performerLayout: l.id, playerCount: countMap[l.id] ?? 4 });
                    }} style={{
                      padding: '7px 10px', borderRadius: 6, fontSize: 11, textAlign: 'left',
                      cursor: 'pointer', fontFamily: 'inherit',
                      background: state.performerLayout === l.id ? C.gold : C.btnBg,
                      border: `1px solid ${state.performerLayout === l.id ? C.gold : C.btnBorder}`,
                      color: state.performerLayout === l.id ? C.goldText : C.btnColor,
                      fontWeight: state.performerLayout === l.id ? 800 : 500,
                    }}>{l.label}</button>
                  ))}
                </div>
              </>
            )}
            <div style={S.divider} />
            <div style={S.secTitle}>Club Identity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field label="Club Name" value={state.clubName} onChange={v => onChange({ clubName: v })} placeholder="Your Club CC" />
              <Field label="Tagline" value={state.clubTagline} onChange={v => onChange({ clubTagline: v })} placeholder="Est. 1892 · County League" />
              <UploadZone label="Club Logo" value={state.logoDataUrl} onChange={v => onChange({ logoDataUrl: v })} />
              {state.logoDataUrl && (
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                  <input type="checkbox" checked={state.logoNoBg||false} onChange={e => onChange({logoNoBg:e.target.checked})} />
                  <span style={{ fontSize:11, color:C.textSec }}>Transparent logo background</span>
                </label>
              )}
            </div>
          </div>
        );

      case 'layers':
        // Layers panel is handled separately as a sibling panel
        return null;

      case 'content':
        return (
          <div style={{ padding: '12px 12px', display:'flex', flexDirection:'column', gap:10 }}>
            {/* Image layers */}
            <div style={S.secTitle}>Image Layers</div>
            <div style={{ background:'#12141c', border:'1px dashed #fbbf2466', borderRadius:8, padding:12, textAlign:'center' }}>
              <div style={{ fontSize:11, color:C.gold, fontWeight:700, marginBottom:4 }}>Add Images to Poster</div>
              <div style={{ fontSize:10, color:C.textSec, marginBottom:8 }}>PNG with transparent background recommended</div>
              <label style={{ cursor:'pointer', display:'inline-block', background:'#21253a', border:'1px solid #fbbf24', borderRadius:6, padding:'6px 16px', fontSize:11, color:C.gold, fontWeight:700 }}>
                + Add Image(s)
                <input type="file" accept="image/*" multiple style={{ display:'none' }}
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    const existing = state.imageLayers || [];
                    const newLayers: ImageLayer[] = [];
                    let loaded = 0;
                    files.forEach((file, idx) => {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const maxZ = existing.length ? Math.max(...existing.map(l => l.zIndex)) : 0;
                        newLayers[idx] = {
                          id: `img-${Date.now()}-${idx}`,
                          dataUrl: ev.target?.result as string,
                          x: 50, y: 50,
                          scale: 60,
                          zIndex: maxZ + idx + 1,
                          flipH: false,
                        };
                        loaded++;
                        if (loaded === files.length) {
                          onChange({ imageLayers: [...existing, ...newLayers.filter(Boolean)] });
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            {(state.imageLayers?.length > 0) && (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {state.imageLayers.map((layer, i) => (
                  <div key={layer.id} style={{ background:C.subCard, border:`1px solid ${C.border}`, borderRadius:7, padding:'6px 8px', display:'flex', alignItems:'center', gap:8 }}>
                    <img src={layer.dataUrl} style={{ width:28, height:28, objectFit:'contain', borderRadius:3 }} />
                    <span style={{ flex:1, fontSize:10, color:C.textSec }}>Image {i+1}</span>
                    <span style={{ fontSize:10, color:'#5a6a8a' }}>z:{layer.zIndex}</span>
                    <button onClick={() => onChange({ imageLayers: (state.imageLayers||[]).filter(l => l.id !== layer.id) })}
                      style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#ef4444', padding:'2px' }}>✕</button>
                  </div>
                ))}
                <button onClick={() => onChange({ imageLayers: [] })}
                  style={{ fontSize:10, color:'#ef4444', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                  Clear all images
                </button>
              </div>
            )}
            <div style={S.divider} />
            <ContentFields state={state} onChange={onChange} />
          </div>
        );

      case 'style':
        return (
          <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={S.secTitle}>Background Style</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, maxHeight: 400, overflowY: 'auto' }}>
              {BG_STYLES.map(bg => (
                <button key={bg.id} onClick={() => onChange({ style: bg.id as AppState['style'] })}
                  title={bg.name}
                  style={{
                    aspectRatio: '4/5', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', padding: 0,
                    border: `2px solid ${state.style === bg.id ? C.gold : 'transparent'}`,
                    transform: state.style === bg.id ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.12s',
                  }}>
                  <div className={`poster style-${bg.id} palette-${state.palette}`}
                    style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 2, borderRadius: 0 }}>
                    <span style={{ fontSize: 6, fontWeight: 900, color: 'rgba(255,255,255,0.8)', textShadow: '0 0 3px #000', lineHeight: 1 }}>{bg.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'colours':
        return (
          <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={S.secTitle}>Palette</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
              {PALETTES.map(p => (
                <button key={p.id} onClick={() => onChange({ palette: p.id })} title={p.name}
                  style={{
                    borderRadius: 7, overflow: 'hidden', cursor: 'pointer', padding: 0,
                    border: `2px solid ${state.palette === p.id ? C.gold : 'transparent'}`,
                    transition: 'all 0.12s',
                  }}>
                  <div style={{ display: 'flex', height: 22 }}>
                    <div style={{ flex: 1, background: p.navy }} />
                    <div style={{ flex: 1, background: p.blue }} />
                    <div style={{ flex: 1, background: p.gold }} />
                  </div>
                  <div style={{ background: C.subCard, textAlign: 'center', fontSize: 7.5, color: C.label, padding: '2px 2px 3px', fontWeight: 600 }}>
                    {p.name}
                  </div>
                </button>
              ))}
            </div>
            <div style={S.divider} />
            <div style={S.secTitle}>Custom Overrides</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ColorRow label="Primary (Navy)" value={state.customNavy} onChange={v => onChange({ customNavy: v })} />
              <ColorRow label="Secondary (Blue)" value={state.customBlue} onChange={v => onChange({ customBlue: v })} />
              <ColorRow label="Accent (Gold)" value={state.customGold} onChange={v => onChange({ customGold: v })} />
              <ColorRow label="Text Colour" value={state.textColor} onChange={v => onChange({ textColor: v })} />
              <ColorRow label="Accent Colour" value={state.accentColor} onChange={v => onChange({ accentColor: v })} />
            </div>
          </div>
        );

      case 'adjust':
        return <AdjustPanelContent state={state} onChange={onChange} />;

      case 'sponsors':
        return (
          <div style={{ padding: '12px 12px' }}>
            <SponsorsPanel state={state} onChange={onChange} />
          </div>
        );

      case 'background':
        return (
          <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={S.secTitle}>Background Photo</div>
            <UploadZone label="" value={state.bgImageDataUrl} onChange={v => onChange({ bgImageDataUrl: v })} />
            {state.bgImageDataUrl && (
              <>
                <div style={S.divider} />
                <SliderField label="Opacity" value={state.bgOpacity} min={0} max={100} onChange={v => onChange({bgOpacity:v})} />
                <SliderField label="Size" value={state.bgSize} min={10} max={300} onChange={v => onChange({bgSize:v})} />
                <SliderField label="Position X" value={state.bgPosX} min={0} max={100} onChange={v => onChange({bgPosX:v})} />
                <SliderField label="Position Y" value={state.bgPosY} min={0} max={100} onChange={v => onChange({bgPosY:v})} />
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const RIGHT_TABS = [
    { id: 'design' as const, label: 'Design' },
    { id: 'style' as const, label: 'Style' },
    { id: 'adjust' as const, label: 'Adjust' },
    { id: 'export' as const, label: 'Export' },
  ];

  const renderRightPanelContent = () => {
    switch (rightTab) {
      case 'design':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={S.secTitle}>Template</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => onChange({ template: t.id })} style={{
                    padding: '7px 4px', borderRadius: 5, fontSize: 10, textAlign: 'center',
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: state.template === t.id ? C.gold : C.btnBg,
                    border: `1px solid ${state.template === t.id ? C.gold : C.btnBorder}`,
                    color: state.template === t.id ? C.goldText : C.btnColor,
                    fontWeight: state.template === t.id ? 800 : 500,
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
            {state.template === 'performer' && (
              <>
                <div style={S.divider} />
                <div>
                  <div style={S.secTitle}>Performer Layout</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {([
                      { id: '4-player', label: '4 Players' },
                      { id: '3-player', label: '3 Players' },
                      { id: '2-player', label: '2 Players' },
                      { id: '2-player-large', label: '2 Players (full-width)' },
                      { id: '1-player-hero', label: '1 Player (hero)' },
                    ] as const).map(l => (
                      <button key={l.id} onClick={() => onChange({ performerLayout: l.id })} style={{
                        padding: '6px 8px', borderRadius: 5, fontSize: 10.5, textAlign: 'left',
                        cursor: 'pointer', fontFamily: 'inherit',
                        background: state.performerLayout === l.id ? C.gold : C.btnBg,
                        border: `1px solid ${state.performerLayout === l.id ? C.gold : C.btnBorder}`,
                        color: state.performerLayout === l.id ? C.goldText : C.btnColor,
                        fontWeight: state.performerLayout === l.id ? 700 : 400,
                      }}>{l.label}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div style={S.divider} />
            <div>
              <div style={S.secTitle}>Aspect Ratio</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 4 }}>
                {([
                  { id: 'story', label: '9:16 Story' },
                  { id: 'fourfive', label: '4:5 Post' },
                  { id: 'square', label: '1:1 Square' },
                  { id: 'landscape', label: '16:9 Wide' },
                ] as const).map(r => (
                  <button key={r.id} onClick={() => onChange({ratio: r.id})} style={{
                    padding: '6px 4px', borderRadius: 5, fontSize: 9.5, fontWeight: 600, textAlign: 'center',
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: state.ratio === r.id ? C.gold : '#161a26',
                    border: `1px solid ${state.ratio === r.id ? C.gold : '#252d42'}`,
                    color: state.ratio === r.id ? C.goldText : '#6b7494',
                  }}>{r.label}</button>
                ))}
              </div>
            </div>
            <div style={S.divider} />
            <ContentFields state={state} onChange={onChange} />
          </div>
        );

      case 'style':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={S.secTitle}>Quick Styles</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3 }}>
                {BG_STYLES.map(bg => (
                  <button key={bg.id} onClick={() => onChange({style: bg.id as AppState['style']})} title={bg.name}
                    style={{ aspectRatio:'4/5', borderRadius:3, overflow:'hidden', cursor:'pointer', padding:0,
                      border:`2px solid ${state.style===bg.id ? C.gold : 'transparent'}`, transition:'all 0.1s' }}>
                    <div className={`poster style-${bg.id} palette-${state.palette}`} style={{ width:'100%', height:'100%', display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:1, borderRadius:0 }}>
                      <span style={{ fontSize:6, fontWeight:900, color:'rgba(255,255,255,0.8)', textShadow:'0 0 3px #000' }}>{bg.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div style={S.divider} />
            <div>
              <div style={S.secTitle}>Quick Palettes</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:3 }}>
                {PALETTES.map(p => (
                  <button key={p.id} onClick={() => onChange({palette:p.id})} title={p.name}
                    style={{ height:22, borderRadius:4, overflow:'hidden', cursor:'pointer', padding:0,
                      border:`2px solid ${state.palette===p.id ? C.gold : 'transparent'}`, transition:'all 0.1s' }}>
                    <div style={{ display:'flex', height:'100%' }}>
                      <div style={{ flex:1, background:p.navy }} />
                      <div style={{ flex:1, background:p.blue }} />
                      <div style={{ flex:1, background:p.gold }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'adjust':
        return <AdjustPanelContent state={state} onChange={onChange} />;

      case 'export':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={S.secTitle}>Format</div>
              <div style={{ fontSize: 12, color: C.textSec, background: C.btnBg, border: `1px solid ${C.btnBorder}`, borderRadius: 6, padding: '8px 10px' }}>
                JPG (optimised for social media)
              </div>
            </div>
            <div>
              <div style={S.secTitle}>Quality</div>
              <select value={pixelRatio} onChange={e => setPixelRatio(Number(e.target.value))}
                style={{ ...S.input }}>
                <option value={2}>Standard (2×) ~720px</option>
                <option value={3}>HD (3×) ~1080px</option>
                <option value={4}>Ultra (4×) ~1440px</option>
              </select>
              <div style={{ fontSize: 9, color: '#3a4260', marginTop: 4 }}>
                360px × {pixelRatio}× = {360 * pixelRatio}px wide
              </div>
            </div>
            <button onClick={() => handleExport(pixelRatio)} disabled={exporting}
              style={{ width:'100%', padding:'11px', background:C.gold, color:C.goldText, fontWeight:900, fontSize:13, border:'none', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity: exporting ? 0.5 : 1, fontFamily:'inherit' }}>
              {exporting ? 'Exporting…' : '⬇ Export JPG'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Determine if layers panel shows separately or as part of left panel
  const showLayersAsPanel = activePanel === 'layers' && layersOpen;
  const showLeftContent = activePanel !== 'layers';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'#0f1117', color:'#e8ecf4', fontFamily:'system-ui,-apple-system,sans-serif' }}>

      {/* ── TOP BAR ── */}
      <div style={{ height:44, background:'#16181f', borderBottom:'1px solid #272b3a', display:'flex', alignItems:'center', padding:'0 16px', gap:12, flexShrink:0 }}>
        <span style={{ fontWeight:900, color:C.gold, letterSpacing:'0.12em', fontSize:13 }}>BOUNDARY SOCIAL</span>
        <span style={{ width:1, height:18, background:'#2d3242' }} />
        <span style={{ fontSize:11, color:'#9099b5', textTransform:'capitalize' }}>{state.template.replace(/-/g,' ')}</span>
        <span style={{ fontSize:10, background:'#1e2130', color:'#7c87a6', border:'1px solid #2e3348', borderRadius:4, padding:'2px 7px', fontFamily:'monospace', textTransform:'uppercase' }}>
          style-{state.style}
        </span>
        <span style={{ fontSize:10, background:'#1e2130', color:'#7c87a6', border:'1px solid #2e3348', borderRadius:4, padding:'2px 7px', fontFamily:'monospace' }}>
          {state.palette}
        </span>
        {/* Aspect ratio — always visible */}
        <div style={{ display:'flex', gap:3, alignItems:'center', background:'#21253a', borderRadius:8, padding:'3px 5px' }}>
          {([{id:'story',label:'9:16'},{id:'fourfive',label:'4:5'},{id:'square',label:'1:1'},{id:'landscape',label:'16:9'}] as const).map(r => (
            <button key={r.id} onClick={() => onChange({ratio:r.id})} style={{
              padding:'3px 7px', borderRadius:5, fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              background: state.ratio===r.id ? C.gold : 'transparent',
              border: `1px solid ${state.ratio===r.id ? C.gold : 'transparent'}`,
              color: state.ratio===r.id ? C.goldText : '#6b7494',
            }}>{r.label}</button>
          ))}
        </div>
        {/* Zoom controls */}
        <div style={{ display:'flex', alignItems:'center', gap:4, background:'#21253a', borderRadius:8, padding:'2px 4px' }}>
          {(() => {
            const zoomBtn: React.CSSProperties = { width:22, height:22, borderRadius:5, background:'transparent', border:'none', color:'#a8b4cc', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, lineHeight:1 };
            return (<>
              <button onClick={() => setZoom(z => Math.max(0.25, +(z - 0.1).toFixed(2)))} style={zoomBtn}>−</button>
              <input
                type="text"
                value={Math.round(zoom * 100) + '%'}
                onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 25 && v <= 200) setZoom(v / 100); }}
                style={{ width:46, textAlign:'center', background:'transparent', border:'none', color:'#eef1f8', fontSize:13, fontFamily:'monospace', fontWeight:700, outline:'none' }}
              />
              <button onClick={() => setZoom(z => Math.min(2.0, +(z + 0.1).toFixed(2)))} style={zoomBtn}>+</button>
              <button onClick={() => setZoom(1.0)} style={{ ...zoomBtn, fontSize:10, color:'#7b89a8', width:'auto', padding:'0 4px' }}>Fit</button>
            </>);
          })()}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          {/* Header toggle — quick access */}
          <button
            title={state.showHeader !== false ? 'Hide club header bar' : 'Show club header bar'}
            onClick={() => onChange({ showHeader: state.showHeader === false ? true : false })}
            style={{
              fontSize:11, padding:'5px 10px',
              background: state.showHeader !== false ? 'transparent' : '#21253a',
              color: state.showHeader !== false ? '#9099b5' : C.gold,
              border: `1px solid ${state.showHeader !== false ? '#2d3248' : C.gold}`,
              borderRadius:20, cursor:'pointer', fontFamily:'inherit',
              display:'flex', alignItems:'center', gap:5,
            }}>
            {state.showHeader !== false ? '⊟ Header' : '⊞ Header'}
          </button>
          {/* Reset Poster to Defaults */}
          <button
            title="Reset poster to default state"
            onClick={() => {
              if (confirm('Reset poster to defaults? This will clear all your changes.')) {
                setState(DEFAULT_STATE);
                saveState(DEFAULT_STATE);
              }
            }}
            style={{ fontSize:11, padding:'5px 10px', background:'transparent', color:'#6b7494', border:'1px solid #2d3248', borderRadius:20, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
            ↺ Reset
          </button>
          <button onClick={() => setStudioMode(v => !v)} style={{
            fontSize:11, padding:'5px 14px',
            background: studioMode ? C.gold : 'transparent',
            color: studioMode ? '#000' : '#9099b5',
            border: `1px solid ${studioMode ? C.gold : '#2d3248'}`,
            borderRadius:20, cursor:'pointer', fontFamily:'inherit',
            fontWeight: studioMode ? 800 : 500,
            display:'flex', alignItems:'center', gap:6,
          }}>
            <span>{studioMode ? '✏️' : '⬡'}</span>
            {studioMode ? 'Studio ON' : 'Studio'}
          </button>
          {/* Quick photo add */}
          <label style={{ fontSize:11, padding:'5px 10px', background:'transparent', color:'#9099b5', border:'1px solid #2d3248', borderRadius:20, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }} title="Add image(s) to poster">
            🖼 Photo
            <input type="file" accept="image/*" multiple style={{ display:'none' }}
              onChange={e => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;
                const existing = state.imageLayers || [];
                const newLayers: ImageLayer[] = [];
                let loaded = 0;
                files.forEach((file, idx) => {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const maxZ = existing.length ? Math.max(...existing.map((l: ImageLayer) => l.zIndex)) : 0;
                    newLayers[idx] = { id: `img-${Date.now()}-${idx}`, dataUrl: ev.target?.result as string, x: 50, y: 50, scale: 60, zIndex: maxZ + idx + 1, flipH: false };
                    loaded++;
                    if (loaded === files.length) onChange({ imageLayers: [...existing, ...newLayers.filter(Boolean)] });
                  };
                  reader.readAsDataURL(file);
                });
                e.target.value = '';
              }}
            />
          </label>
          <button onClick={() => handleExport(pixelRatio)} disabled={exporting}
            style={{ fontSize:12, fontWeight:800, padding:'6px 16px', background:C.gold, color:C.goldText, border:'none', borderRadius:7, cursor:'pointer', opacity: exporting?0.5:1, fontFamily:'inherit' }}>
            {exporting ? 'Exporting…' : 'Export JPG'}
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Icon sidebar */}
        <IconSidebar active={activePanel} onSelect={(panel) => {
          if (panel === 'layers') {
            setLayersOpen(true);
          }
          setActivePanel(panel);
        }} />

        {/* Layers panel (when layers active) */}
        {activePanel === 'layers' && (
          <LayersPanel
            state={state}
            onChange={onChange}
            isOpen={layersOpen}
            onToggle={() => setLayersOpen(v => !v)}
          />
        )}

        {/* Left content panel (when non-layers panel active) */}
        {showLeftContent && (
          <div style={{
            width: 280,
            flexShrink: 0,
            background: C.panelBg,
            borderRight: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          }}>
            {/* Panel header */}
            <div style={{
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              borderBottom: `1px solid ${C.border}`,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#5a6585', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {activePanel.charAt(0).toUpperCase() + activePanel.slice(1)}
              </span>
            </div>
            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {renderLeftPanelContent()}
            </div>
          </div>
        )}

        {/* ── CANVAS TOOLBAR ── */}
        <div style={{
          width: 40, flexShrink: 0, background: '#13151e',
          borderRight: '1px solid #2a2f42',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: 10, paddingBottom: 10, gap: 2,
        }}>
          {([
            { icon: '↖', label: 'Select', key: 'select' },
            { icon: '✛', label: 'Move', key: 'move' },
            null,
            { icon: 'T', label: 'Text', key: 'text' },
            { icon: '⬜', label: 'Shape', key: 'rect' },
            { icon: '◯', label: 'Circle', key: 'circle' },
            { icon: '╱', label: 'Line', key: 'line' },
            null,
            { icon: '⬡', label: 'Effects', key: 'effects' },
            { icon: '⊞', label: 'Grid', key: 'grid' },
          ] as (null | { icon: string; label: string; key: string })[]).map((t, i) => t === null ? (
            <div key={i} style={{ width: 28, height: 1, background: '#2a2f42', margin: '4px 0' }} />
          ) : (
            <button
              key={t.key}
              title={t.label}
              onClick={() => { if (t.key === 'move') setStudioMode(true); if (t.key === 'select') setStudioMode(false); }}
              style={{
                width: 32, height: 32, borderRadius: 6, border: 'none',
                background: (t.key === 'move' && studioMode) || (t.key === 'select' && !studioMode) ? '#fbbf24' : 'transparent',
                color: (t.key === 'move' && studioMode) || (t.key === 'select' && !studioMode) ? '#000' : '#7b89a8',
                fontSize: t.key === 'text' ? 13 : 15,
                fontWeight: t.key === 'text' ? 800 : 400,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.1s',
              }}
            >{t.icon}</button>
          ))}
        </div>

        {/* ── CENTER CANVAS ── */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#090b11', overflow:'auto', padding:'28px 20px 20px 28px', position:'relative' }}>
          {/* Corner */}
          <div style={{ position:'sticky', top:0, left:0, zIndex:20 }}></div>
          <div style={{ position:'relative', display:'inline-block' }}>
            {/* Top ruler */}
            <div style={{
              position:'absolute', top:-20, left:20, right:0, height:20,
              background:'#0d0f17', borderBottom:'1px solid #1e2235',
              overflow:'hidden', display:'flex', alignItems:'flex-end',
            }}>
              {Array.from({length:12}, (_,i) => (
                <div key={i} style={{
                  position:'absolute', left: i * 90,
                  top:0, height:'100%', borderLeft:'1px solid #1e2235',
                  display:'flex', alignItems:'flex-end', paddingBottom:2, paddingLeft:3,
                }}>
                  <span style={{ fontSize:8, color:'#3a4460', fontFamily:'monospace' }}>{i*100}</span>
                </div>
              ))}
            </div>
            {/* Left ruler */}
            <div style={{
              position:'absolute', top:0, left:-20, width:20, bottom:0,
              background:'#0d0f17', borderRight:'1px solid #1e2235', overflow:'hidden',
            }}>
              {Array.from({length:16}, (_,i) => (
                <div key={i} style={{
                  position:'absolute', top: i * 90,
                  left:0, width:'100%', borderTop:'1px solid #1e2235',
                  display:'flex', alignItems:'flex-start', paddingTop:2, paddingLeft:2,
                }}>
                  <span style={{ fontSize:8, color:'#3a4460', fontFamily:'monospace', writingMode:'vertical-rl' as const }}>{i*100}</span>
                </div>
              ))}
            </div>
            {/* Poster + studio */}
            <div style={{ marginTop:20, marginLeft:20, boxShadow:'0 24px 80px rgba(0,0,0,0.7)', borderRadius:8, position:'relative',
              transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.15s ease',
            }}>
              <PosterRenderer ref={posterRef} state={state} />
              {/* Image layers overlay — always visible */}
              {(state.imageLayers?.length > 0) && (
                <div style={{ position:'absolute', inset:0, zIndex:30, pointerEvents:'auto' }}>
                  <ImageLayersOverlay
                    layers={state.imageLayers}
                    onChange={layers => onChange({ imageLayers: layers })}
                    posterRef={posterRef}
                    zoom={zoom}
                  />
                </div>
              )}
              {studioMode && (
                <DesignStudio active={studioMode} posterRef={posterRef} zoom={zoom} />
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        {rightOpen ? (
          <div style={{
            width: 280,
            flexShrink: 0,
            background: C.panelBg,
            borderLeft: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            transition: 'width 0.2s ease',
            position: 'relative',
          }}>
            {/* Collapse button */}
            <button
              onClick={() => setRightOpen(false)}
              style={{
                position: 'absolute',
                left: -14,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 14,
                height: 36,
                background: '#1a1d2c',
                border: '1px solid #272b3a',
                borderRight: 'none',
                borderRadius: '6px 0 0 6px',
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

            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              {RIGHT_TABS.map(tab => (
                <button key={tab.id} onClick={() => setRightTab(tab.id)} style={{
                  flex: 1, padding: '10px 4px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: rightTab === tab.id ? C.gold : '#7b89a8',
                  cursor: 'pointer', border: 'none', background: 'none',
                  borderBottom: `2px solid ${rightTab === tab.id ? C.gold : 'transparent'}`,
                  transition: 'color 0.15s', fontFamily: 'inherit',
                }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
              {renderRightPanelContent()}
            </div>
          </div>
        ) : (
          <div style={{ width: 0, position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setRightOpen(true)}
              style={{
                position: 'absolute',
                left: -14,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 14,
                height: 36,
                background: '#1a1d2c',
                border: '1px solid #272b3a',
                borderRight: 'none',
                borderRadius: '6px 0 0 6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4a5270',
                fontSize: 10,
                zIndex: 10,
                padding: 0,
              }}
            >◀</button>
          </div>
        )}
      </div>
    </div>
  );
}
