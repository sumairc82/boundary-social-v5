'use client';
import React, { forwardRef, CSSProperties } from 'react';
import { AppState } from '@/lib/types';

interface Props { state: AppState }

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const PosterRenderer = forwardRef<HTMLDivElement, Props>(({ state }, ref) => {
  const s = state;

  const cssVars = {
    '--poster-w': '360px',
    '--title-scale': s.titleScale / 100,
    '--fixture-scale': s.fixtureScale / 100,
    '--fixture-effective': s.fixtureScale / 100,
    '--meta-scale': s.metaScale / 100,
    '--meta-effective': s.metaScale / 100,
    '--badge-scale': s.badgeScale / 100,
    '--detail-scale': s.badgeScale / 100,
    '--badge-box': `${52 * s.badgeScale / 100}px`,
    '--sponsor-scale': s.sponsorScale / 100,
    '--logo-scale': s.logoScale / 100,
    '--poster-top-pad': `${s.topSpacing}px`,
    '--user-text': s.textColor || '#ffffff',
    '--user-accent': s.accentColor || 'var(--gold)',
    '--user-accent-soft': s.accentColor || 'var(--gold-soft)',
    '--bg-opacity': s.bgOpacity / 100,
    '--bg-size': `${s.bgSize}% auto`,
    '--bg-position': `${s.bgPosX}% ${s.bgPosY}%`,
    '--custom-bg': s.bgImageDataUrl ? `url("${s.bgImageDataUrl}")` : 'none',
    '--media-brightness': s.mediaBrightness / 100,
    '--media-contrast': s.mediaContrast / 100,
    '--media-saturate': s.mediaSaturate / 100,
    '--photo': 'none',
    '--bg-rotate': '0deg',
    '--bg-scale': '1',
    '--content-compress': '1',
    '--white': '#ffffff',
  } as Record<string, string | number>;

  if (s.customNavy) cssVars['--navy'] = s.customNavy;
  if (s.customBlue)  cssVars['--blue'] = s.customBlue;
  if (s.customGold)  cssVars['--gold'] = s.customGold;

  const posterClass = `poster style-${s.style} view-${s.template} palette-${s.palette}`;
  const dataAttrs: Record<string, string> = {
    'data-count': String(s.template === 'performer' ? s.playerCount : 2),
    'data-result-count': String(s.resultCount || 3),
  };

  // ── topBar ──
  const topBarHtml = `
    <header class="top">
      <div class="crest-lockup">
        ${s.logoDataUrl ? `<img class="crest" src="${s.logoDataUrl}" alt="logo">` : ''}
        <div class="club">
          <span>${esc(s.clubName || 'Your Club')}</span>
          <small>${esc(s.clubTagline || '')}</small>
        </div>
      </div>
      ${s.tournamentText ? `<div class="chips"><span class="chip gold">${esc(s.tournamentText)}</span></div>` : ''}
    </header>`;

  // ── titleBlock ──
  const titleBlockHtml = `
    <div class="title-block">
      <h2 class="title">${esc(s.titleTop || '')}${s.titleBottom ? `<span>${esc(s.titleBottom)}</span>` : ''}</h2>
    </div>`;

  // ── detailsGroup ──
  const detailsGroup = (values: string[]) => {
    const tiles = values.slice(0, 4).filter(v => v.trim());
    if (!tiles.length) return '';
    return `<div class="details">${tiles.map((v, i) => `<div class="detail ${i === 0 ? 'gold' : ''}">${esc(v)}</div>`).join('')}</div>`;
  };

  // ── Template content ──
  let contentHtml = '';

  if (s.template === 'matchday' || s.template === 'custom') {
    contentHtml = `${titleBlockHtml}
      <section class="card">
        ${s.matchHome ? `<p class="team">${esc(s.matchHome)}</p>` : ''}
        ${s.matchHome && s.matchAway ? `<div class="vs">vs</div>` : ''}
        ${s.matchAway ? `<p class="team">${esc(s.matchAway)}</p>` : ''}
        ${detailsGroup(s.details || [])}
      </section>`;
  }
  else if (s.template === 'results') {
    const rows = s.results.slice(0, s.resultCount).map(r => {
      const badgeClass = r.outcome === 'L' ? 'loss' : r.outcome === 'NR' ? 'nr' : '';
      return `<div class="row result-row">
        <div class="badge ${badgeClass}">${esc(r.outcome)}</div>
        <div class="row-main">
          ${r.innings1 ? `<div class="row-innings row-title">${esc(r.innings1)}</div>` : ''}
          ${r.innings2 ? `<div class="row-innings row-meta">${esc(r.innings2)}</div>` : ''}
          ${r.resultLine ? `<div class="row-result-line row-meta">${esc(r.resultLine)}</div>` : ''}
        </div>
      </div>`;
    }).join('');
    contentHtml = `${titleBlockHtml}<section class="list">${rows}</section>`;
  }
  else if (s.template === 'performer') {
    const players = s.players.slice(0, s.playerCount).map((p) => `
      <div class="player-card">
        <div class="player-photo" style="--photo:${p.photoDataUrl ? `url('${p.photoDataUrl}')` : 'none'};--photo-zoom:100%;--photo-x:50%;--photo-y:20%"></div>
        <div class="player-copy">
          <div class="role">${esc(p.role)}</div>
          <h3 class="name">${esc(p.name)}</h3>
          <div class="statline">${esc(p.stat)}</div>
        </div>
      </div>`).join('');
    contentHtml = `${titleBlockHtml}<section class="feature-grid">${players}</section>`;
  }
  else if (s.template === 'signing') {
    contentHtml = `${titleBlockHtml}
      <section class="player-card">
        <div class="player-photo" style="--photo:${s.signingPhotoDataUrl ? `url('${s.signingPhotoDataUrl}')` : 'none'};--photo-zoom:100%;--photo-x:50%;--photo-y:20%"></div>
        <div class="player-copy">
          <div class="role">${esc(s.signingRole)}</div>
          <h3 class="name">${esc(s.signingName)}</h3>
          <div class="statline">${esc(s.signingNote)}</div>
        </div>
      </section>`;
  }
  else if (s.template === 'weekend') {
    const rows = s.fixtures.slice(0, 5).filter(f => f.homeTeam || f.awayTeam).map(f => {
      const title = [f.homeTeam, f.awayTeam].filter(Boolean).join(' vs ');
      const hasBadge = Boolean(f.badge || f.time);
      return `<div class="row fixture-row ${hasBadge ? '' : 'no-badge'}">
        ${hasBadge ? `<div class="timebox">${f.badge ? `<span>${esc(f.badge)}</span>` : ''}${f.time ? `<small>${esc(f.time)}</small>` : ''}</div>` : ''}
        <div class="row-main">
          <div class="row-title">${esc(title)}</div>
          ${f.date ? `<div class="row-meta">${esc(f.date)}${f.venue ? ` · ${esc(f.venue)}` : ''}</div>` : ''}
        </div>
      </div>`;
    }).join('');
    contentHtml = `${titleBlockHtml}<section class="list">${rows}</section>`;
  }
  else if (s.template === 'squad') {
    const players = s.squadPlayers.slice(0, 14).map((p, i) => `
      <div class="row schedule-row">
        <div class="role">${String(i + 1).padStart(2, '0')}</div>
        <div class="row-main"><div class="row-title">${esc(typeof p === 'string' ? p : p.name)}</div></div>
      </div>`).join('');
    contentHtml = `${titleBlockHtml}<section class="squad-layout"><div class="squad-grid">${players}</div></section>`;
  }
  else if (s.template === 'notice') {
    contentHtml = `${titleBlockHtml}
      <section class="card">
        <p class="team" style="white-space:pre-line">${esc(s.noticeText)}</p>
      </section>`;
  }
  else if (s.template === 'sponsor') {
    const wall = s.sponsors.length
      ? s.sponsors.slice(0, 4).map(sp =>
          `<div class="sponsor">${sp.logo ? `<div class="logo-bg" style="background-image:url('${sp.logo}')"></div>` : `<div class="logo-bg text-only">${esc(sp.name)}</div>`}</div>`
        ).join('')
      : `<div class="logo-bg text-only" style="min-height:120px;display:flex;align-items:center;justify-content:center;font-size:18px;opacity:0.5">Add your sponsor logo</div>`;
    contentHtml = `${titleBlockHtml}<section class="partner-card"><div class="sponsors">${wall}</div></section>`;
  }

  // ── Footer ──
  const footerHtml = s.sponsors.length && s.template !== 'sponsor' ? `
    <footer class="footer">
      <div class="sponsor-title">Club Partners</div>
      <div class="sponsor-wall featured" data-count="${s.sponsors.length}">
        <div class="sponsor-main">${s.sponsors[0].logo ? `<div class="logo-bg" style="background-image:url('${s.sponsors[0].logo}')"></div>` : `<div class="logo-bg text-only">${esc(s.sponsors[0].name)}</div>`}</div>
        ${s.sponsors.length > 1 ? `<div class="sponsors">${s.sponsors.slice(1).map(sp => `<div class="sponsor">${sp.logo ? `<div class="logo-bg" style="background-image:url('${sp.logo}')"></div>` : `<div class="logo-bg text-only">${esc(sp.name)}</div>`}</div>`).join('')}</div>` : ''}
      </div>
    </footer>` : '';

  const innerHtml = `
    <div class="poster-bg-image"></div>
    <div class="poster-inner">
      ${topBarHtml}
      <main class="content">${contentHtml}</main>
      ${footerHtml}
    </div>`;

  return (
    <div
      ref={ref}
      className={posterClass}
      style={cssVars as CSSProperties}
      {...dataAttrs}
      dangerouslySetInnerHTML={{ __html: innerHtml }}
    />
  );
});

PosterRenderer.displayName = 'PosterRenderer';
export default PosterRenderer;
