'use client';
import React, { useState, useRef } from 'react';
import { AppState, TemplateId } from '@/lib/types';
import { PALETTES } from '@/lib/palettes';
import { BG_STYLES } from '@/lib/bgStyles';
import { LayoutGrid, Paintbrush, Palette, PenLine, SlidersHorizontal, Users } from 'lucide-react';

interface Props {
  state: AppState;
  onChange: (p: Partial<AppState>) => void;
}

// === Colour constants ===
const C = {
  panelBg: '#111318',
  borderColor: '#1e2233',
  inputBg: '#161a26',
  inputBorder: '#252d42',
  labelColor: '#5a6585',
  sectionTitle: '#3d4766',
  textPrimary: '#e2e8f0',
  textSecondary: '#8b93a9',
  activeBg: '#fbbf24',
  activeColor: '#0a0a00',
  btnBg: '#161a26',
  btnBorder: '#252d42',
  btnColor: '#6b7494',
};

const S = {
  input: {
    width: '100%', background: C.inputBg, border: `1px solid ${C.inputBorder}`,
    borderRadius: 6, padding: '7px 10px', fontSize: 12, color: C.textPrimary,
    outline: 'none', fontFamily: 'inherit',
  } as React.CSSProperties,
  label: { fontSize: 10, color: C.labelColor, fontWeight: 600, display: 'block', marginBottom: 4 } as React.CSSProperties,
  sectionTitle: {
    fontSize: 9, color: C.sectionTitle, fontWeight: 700,
    textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8,
  },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  divider: { height: 1, background: C.borderColor, margin: '4px 0' },
};

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
        <span style={{ fontSize: 11, color: C.textSecondary }}>{label}</span>
        <span style={{ fontSize: 10, color: C.activeBg, fontFamily: 'monospace', fontWeight: 700 }}>{value}{label.includes('Scale') ? '%' : ''}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: C.activeBg, cursor: 'pointer' }} />
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
      <span style={{ fontSize: 11, color: C.textSecondary }}>{label}</span>
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
          textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
        {value ? <img src={value} style={{ maxHeight: 56, objectFit: 'contain' }} alt="" /> :
          <>
            <span style={{ fontSize: 20 }}>🖼️</span>
            <span style={{ fontSize: 11, color: C.labelColor }}>Drop or click to upload</span>
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
  { id: 'squad', label: 'Squad' },
  { id: 'notice', label: 'Notice' },
  { id: 'sponsor', label: 'Sponsor' },
  { id: 'custom', label: 'Custom' },
];

const TABS = [
  { id: 'template', label: 'Template', Icon: LayoutGrid },
  { id: 'style',    label: 'Style',    Icon: Paintbrush },
  { id: 'colours',  label: 'Colours',  Icon: Palette },
  { id: 'content',  label: 'Content',  Icon: PenLine },
  { id: 'adjust',   label: 'Adjust',   Icon: SlidersHorizontal },
  { id: 'sponsors', label: 'Sponsors', Icon: Users },
];

export default function ControlPanel({ state, onChange }: Props) {
  const [tab, setTab] = useState('template');
  const [bgCat, setBgCat] = useState('all');

  const updateDetail = (i: number, v: string) => {
    const d = [...(state.details || ['','','','',''])];
    d[i] = v; onChange({ details: d });
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

  void bgCat; // used by filter buttons

  return (
    <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', background: C.panelBg, borderRight: `1px solid ${C.borderColor}`, overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.borderColor}`, background: '#0d1018', flexShrink: 0 }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, padding: '8px 2px 6px', fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.04em', color: tab === id ? C.activeBg : C.sectionTitle,
            cursor: 'pointer', border: 'none', background: 'none',
            borderBottom: `2px solid ${tab === id ? C.activeBg : 'transparent'}`,
            transition: 'color 0.15s', fontFamily: 'inherit',
          }}>
            <Icon size={12} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ─── TEMPLATE TAB ─── */}
        {tab === 'template' && (
          <>
            <div>
              <div style={S.sectionTitle}>Template</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => onChange({ template: t.id })} style={{
                    padding: '8px 4px', borderRadius: 6, fontSize: 11, textAlign: 'center',
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: state.template === t.id ? C.activeBg : C.btnBg,
                    border: `1px solid ${state.template === t.id ? C.activeBg : C.btnBorder}`,
                    color: state.template === t.id ? C.activeColor : C.btnColor,
                    fontWeight: state.template === t.id ? 800 : 600,
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
            <div style={S.divider} />
            <div>
              <div style={S.sectionTitle}>Club Identity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Field label="Club Name" value={state.clubName} onChange={v => onChange({ clubName: v })} placeholder="Your Club CC" />
                <Field label="Tagline" value={state.clubTagline} onChange={v => onChange({ clubTagline: v })} placeholder="Est. 1892 · County League" />
                <UploadZone label="Club Logo" value={state.logoDataUrl} onChange={v => onChange({ logoDataUrl: v })} />
              </div>
            </div>
          </>
        )}

        {/* ─── STYLE TAB ─── */}
        {tab === 'style' && (
          <>
            <div>
              <div style={S.sectionTitle}>Background Style</div>
              {/* Category filter */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                {['all','gradient','stripe','conic','dark','grid'].map(cat => (
                  <button key={cat} onClick={() => setBgCat(cat)} style={{
                    padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: bgCat === cat ? C.activeBg : C.btnBg,
                    border: `1px solid ${bgCat === cat ? C.activeBg : C.btnBorder}`,
                    color: bgCat === cat ? C.activeColor : C.btnColor,
                  }}>{cat}</button>
                ))}
              </div>
              {/* Style swatches */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
                {BG_STYLES.map(bg => (
                  <button key={bg.id} onClick={() => onChange({ style: bg.id as AppState['style'] })}
                    title={bg.name}
                    style={{
                      aspectRatio: '4/5', borderRadius: 4, overflow: 'hidden', cursor: 'pointer', padding: 0,
                      border: `2px solid ${state.style === bg.id ? C.activeBg : 'transparent'}`,
                      transform: state.style === bg.id ? 'scale(1.08)' : 'scale(1)',
                      transition: 'all 0.12s',
                    }}>
                    {/* render as a mini poster div using V1 CSS classes */}
                    <div className={`poster style-${bg.id} palette-${state.palette}`}
                      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 2, borderRadius: 0 }}>
                      <span style={{ fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.8)', textShadow: '0 0 3px #000', lineHeight: 1 }}>
                        {bg.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div style={S.divider} />
            <div>
              <div style={S.sectionTitle}>Background Photo</div>
              <UploadZone label="" value={state.bgImageDataUrl} onChange={v => onChange({ bgImageDataUrl: v })} />
            </div>
          </>
        )}

        {/* ─── COLOURS TAB ─── */}
        {tab === 'colours' && (
          <>
            <div>
              <div style={S.sectionTitle}>Palette</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                {PALETTES.map(p => (
                  <button key={p.id} onClick={() => onChange({ palette: p.id })} title={p.name}
                    style={{
                      borderRadius: 7, overflow: 'hidden', cursor: 'pointer', padding: 0,
                      border: `2px solid ${state.palette === p.id ? C.activeBg : 'transparent'}`,
                      transform: state.palette === p.id ? 'scale(1.06)' : 'scale(1)',
                      transition: 'all 0.12s',
                    }}>
                    <div style={{ display: 'flex', height: 24 }}>
                      <div style={{ flex: 1, background: p.navy }} />
                      <div style={{ flex: 1, background: p.blue }} />
                      <div style={{ flex: 1, background: p.gold }} />
                    </div>
                    <div style={{ background: '#161a26', textAlign: 'center', fontSize: 7.5, color: C.labelColor, padding: '2px 2px 3px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div style={S.divider} />
            <div>
              <div style={S.sectionTitle}>Custom Overrides</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ColorRow label="Primary (Navy)" value={state.customNavy} onChange={v => onChange({ customNavy: v })} />
                <ColorRow label="Secondary (Blue)" value={state.customBlue} onChange={v => onChange({ customBlue: v })} />
                <ColorRow label="Accent (Gold)" value={state.customGold} onChange={v => onChange({ customGold: v })} />
                <ColorRow label="Text Colour" value={state.textColor} onChange={v => onChange({ textColor: v })} />
                <ColorRow label="Accent Colour" value={state.accentColor} onChange={v => onChange({ accentColor: v })} />
              </div>
            </div>
          </>
        )}

        {/* ─── CONTENT TAB ─── */}
        {tab === 'content' && (
          <>
            <div>
              <div style={S.sectionTitle}>Title</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Field label="Title Line 1" value={state.titleTop} onChange={v => onChange({ titleTop: v })} placeholder="MATCH" />
                <Field label="Title Line 2 (gold)" value={state.titleBottom} onChange={v => onChange({ titleBottom: v })} placeholder="DAY" />
                <Field label="Tournament / Badge" value={state.tournamentText} onChange={v => onChange({ tournamentText: v })} placeholder="Premier Division" />
              </div>
            </div>
            <div style={S.divider} />

            {/* matchday / custom */}
            {(state.template === 'matchday' || state.template === 'custom') && (
              <div>
                <div style={S.sectionTitle}>Match Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Field label="Home Team" value={state.matchHome} onChange={v => onChange({ matchHome: v })} />
                  <Field label="Away Team" value={state.matchAway} onChange={v => onChange({ matchAway: v })} />
                  <Field label="Date" value={state.matchDate} onChange={v => onChange({ matchDate: v })} />
                  <Field label="Time" value={state.matchTime} onChange={v => onChange({ matchTime: v })} />
                  <Field label="Venue" value={state.matchVenue} onChange={v => onChange({ matchVenue: v })} />
                  <div style={S.sectionTitle}>Detail Tiles</div>
                  {[0,1,2,3].map(i => (
                    <Field key={i} label={`Tile ${i+1}`} value={state.details?.[i]||''} onChange={v => updateDetail(i,v)} />
                  ))}
                </div>
              </div>
            )}

            {/* results */}
            {state.template === 'results' && (
              <div>
                <div style={S.sectionTitle}>Results</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: C.textSecondary }}>Show:</span>
                  {[1,2,3,4].map(n => (
                    <button key={n} onClick={() => onChange({ resultCount: n })} style={{
                      width: 26, height: 26, borderRadius: 5, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      background: state.resultCount === n ? C.activeBg : C.btnBg,
                      border: `1px solid ${state.resultCount === n ? C.activeBg : C.btnBorder}`,
                      color: state.resultCount === n ? C.activeColor : C.btnColor,
                    }}>{n}</button>
                  ))}
                </div>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ background: '#0d1018', border: `1px solid ${C.borderColor}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: C.activeBg, fontWeight: 700, marginBottom: 8 }}>Result {i+1}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={S.field}>
                        <label style={S.label}>Outcome</label>
                        <select value={state.results[i]?.outcome||'W'} onChange={e => updateResult(i,'outcome',e.target.value)}
                          style={{ ...S.input }}>
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

            {/* performer */}
            {state.template === 'performer' && (
              <div>
                <div style={S.sectionTitle}>Players</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: C.textSecondary }}>Count:</span>
                  {[1,2,3,4].map(n => (
                    <button key={n} onClick={() => onChange({ playerCount: n })} style={{
                      width: 26, height: 26, borderRadius: 5, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      background: state.playerCount === n ? C.activeBg : C.btnBg,
                      border: `1px solid ${state.playerCount === n ? C.activeBg : C.btnBorder}`,
                      color: state.playerCount === n ? C.activeColor : C.btnColor,
                    }}>{n}</button>
                  ))}
                </div>
                {Array.from({length: state.playerCount}).map((_,i) => (
                  <div key={i} style={{ background: '#0d1018', border: `1px solid ${C.borderColor}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: C.activeBg, fontWeight: 700, marginBottom: 8 }}>Player {i+1}</div>
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

            {/* signing */}
            {state.template === 'signing' && (
              <div>
                <div style={S.sectionTitle}>New Signing</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Field label="Player Name" value={state.signingName} onChange={v => onChange({ signingName: v })} />
                  <Field label="Role" value={state.signingRole} onChange={v => onChange({ signingRole: v })} />
                  <Field label="Note / Stat" value={state.signingNote} onChange={v => onChange({ signingNote: v })} />
                  <UploadZone label="Photo" value={state.signingPhotoDataUrl} onChange={v => onChange({ signingPhotoDataUrl: v })} />
                </div>
              </div>
            )}

            {/* weekend */}
            {state.template === 'weekend' && (
              <div>
                <div style={S.sectionTitle}>Fixtures (up to 5)</div>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ background: '#0d1018', border: `1px solid ${C.borderColor}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: C.activeBg, fontWeight: 700, marginBottom: 8 }}>Fixture {i+1}</div>
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

            {/* squad */}
            {state.template === 'squad' && (
              <div>
                <div style={S.sectionTitle}>Squad Players</div>
                <textarea placeholder="Paste names, one per line" rows={4}
                  style={{ ...S.input, resize: 'vertical' as const, minHeight: 80, marginBottom: 8 }}
                  onBlur={e => { const lines = e.target.value.split('\n').filter(l=>l.trim()); if(lines.length) onChange({squadPlayers:lines}); }} />
                {Array.from({length:12}).map((_,i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <input type="text" value={state.squadPlayers[i]||''} placeholder={`Player ${i+1}`}
                      onChange={e => { const p=[...state.squadPlayers]; p[i]=e.target.value; onChange({squadPlayers:p}); }}
                      style={S.input} />
                  </div>
                ))}
              </div>
            )}

            {/* notice */}
            {state.template === 'notice' && (
              <div>
                <div style={S.sectionTitle}>Notice Text</div>
                <Field label="" value={state.noticeText} onChange={v => onChange({ noticeText: v })} multiline />
              </div>
            )}
          </>
        )}

        {/* ─── ADJUST TAB ─── */}
        {tab === 'adjust' && (
          <>
            <div style={S.sectionTitle}>Text Sizes</div>
            <SliderField label="Title Scale" value={state.titleScale} min={50} max={200} onChange={v => onChange({titleScale:v})} />
            <SliderField label="Fixture Scale" value={state.fixtureScale} min={50} max={200} onChange={v => onChange({fixtureScale:v})} />
            <SliderField label="Meta Scale" value={state.metaScale} min={50} max={200} onChange={v => onChange({metaScale:v})} />
            <SliderField label="Badge Scale" value={state.badgeScale} min={50} max={200} onChange={v => onChange({badgeScale:v})} />
            <SliderField label="Sponsor Scale" value={state.sponsorScale} min={35} max={200} onChange={v => onChange({sponsorScale:v})} />
            <SliderField label="Logo Scale" value={state.logoScale} min={20} max={200} onChange={v => onChange({logoScale:v})} />
            <div style={S.divider} />
            <div style={S.sectionTitle}>Spacing</div>
            <SliderField label="Top Spacing" value={state.topSpacing} min={0} max={34} onChange={v => onChange({topSpacing:v})} />
            <div style={S.divider} />
            <div style={S.sectionTitle}>Background Photo</div>
            <SliderField label="Opacity" value={state.bgOpacity} min={0} max={100} onChange={v => onChange({bgOpacity:v})} />
            <SliderField label="Size" value={state.bgSize} min={10} max={300} onChange={v => onChange({bgSize:v})} />
            <SliderField label="Position X" value={state.bgPosX} min={0} max={100} onChange={v => onChange({bgPosX:v})} />
            <SliderField label="Position Y" value={state.bgPosY} min={0} max={100} onChange={v => onChange({bgPosY:v})} />
            <div style={S.divider} />
            <div style={S.sectionTitle}>Photo Filters</div>
            <SliderField label="Brightness" value={state.mediaBrightness} min={80} max={200} onChange={v => onChange({mediaBrightness:v})} />
            <SliderField label="Contrast" value={state.mediaContrast} min={80} max={200} onChange={v => onChange({mediaContrast:v})} />
            <SliderField label="Vibrance" value={state.mediaSaturate} min={80} max={200} onChange={v => onChange({mediaSaturate:v})} />
          </>
        )}

        {/* ─── SPONSORS TAB ─── */}
        {tab === 'sponsors' && (
          <div>
            <div style={S.sectionTitle}>Sponsors</div>
            {state.sponsors.map((sp, i) => (
              <div key={i} style={{ background: '#0d1018', border: `1px solid ${C.borderColor}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: C.activeBg, fontWeight: 700 }}>Sponsor {i+1}</span>
                  <button onClick={() => onChange({ sponsors: state.sponsors.filter((_,j)=>j!==i) })}
                    style={{ fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
                <Field label="Name" value={sp.name} onChange={v => { const s=[...state.sponsors]; s[i]={...s[i],name:v}; onChange({sponsors:s}); }} />
                <div style={{ marginTop: 6 }}>
                  <UploadZone label="Logo" value={sp.logo} onChange={v => { const s=[...state.sponsors]; s[i]={...s[i],logo:v}; onChange({sponsors:s}); }} />
                </div>
              </div>
            ))}
            <button onClick={() => onChange({ sponsors: [...state.sponsors, { name: '', logo: '' }] })}
              style={{ width: '100%', padding: '8px', background: C.btnBg, border: `1px dashed ${C.btnBorder}`, borderRadius: 7, fontSize: 12, color: C.textSecondary, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add Sponsor
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
