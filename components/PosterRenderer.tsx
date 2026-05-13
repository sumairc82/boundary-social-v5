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
    '--detail-scale': (s.detailScale ?? 100) / 100,
    '--badge-box': `${52 * s.badgeScale / 100}px`,
    '--sponsor-scale': s.sponsorScale / 100,
    ...(s.sponsorHeight ? { '--sponsor-h-override': `${s.sponsorHeight}px` } : {}),
    '--logo-scale': s.logoScale / 100,
    '--logo-x': `${s.logoX ?? 0}px`,
    '--logo-y': `${s.logoY ?? 0}px`,
    '--poster-top-pad': `${s.topSpacing}px`,
    '--title-top-scale': (s.titleTopScale ?? 100) / 100,
    '--title-bot-scale': (s.titleBotScale ?? 100) / 100,
    '--headline-x': `${s.headlineX ?? 0}px`,
    '--headline-y': `${s.headlineY ?? 0}px`,
    '--headline-ls': `${((s.headlineSpacing ?? 100) - 100) * 0.008}em`,
    '--content-y': `${s.contentY ?? 0}px`,
    '--content-x': `${s.contentX ?? 0}px`,
    '--content-scale': (s.contentScale ?? 100) / 100,
    '--pad-top': `${s.padTop ?? 0}px`,
    '--pad-bottom': `${s.padBottom ?? 0}px`,
    '--pad-left': `${s.padLeft ?? 0}px`,
    '--pad-right': `${s.padRight ?? 0}px`,
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

  const ratioCSS: Record<string, React.CSSProperties> = {
    story:    { aspectRatio: '9/16' },
    fourfive: { aspectRatio: '4/5' },
    square:   { aspectRatio: '1/1' },
    landscape:{ aspectRatio: '16/9' },
  };
  const extraRatioStyle = ratioCSS[s.ratio || 'story'] || {};
  if (s.ratio === 'landscape') (cssVars as Record<string, string>)['--poster-w'] = '480px';

  const posterLayout = s.performerLayout || '4-player';
  const layoutDataAttr = `performer-layout-${posterLayout}`;

  const posterClassParts = [`poster style-${s.style} view-${s.template} palette-${s.palette}`];
  if (s.logoNoBg) posterClassParts.push('logo-no-bg');
  if (s.sponsorNoBg) posterClassParts.push('sponsor-no-bg');
  if (s.template === 'performer') posterClassParts.push(layoutDataAttr);
  if (s.showHeader === false) posterClassParts.push('no-header');
  const posterClass = posterClassParts.join(' ');

  // player count derived from layout
  let effectivePlayerCount = s.playerCount;
  if (s.template === 'performer') {
    if (posterLayout === '1-player-hero') effectivePlayerCount = 1;
    else if (posterLayout === '2-player' || posterLayout === '2-player-large' || posterLayout === '2-player-showcase') effectivePlayerCount = 2;
    else if (posterLayout === '3-player' || posterLayout === '3-player-showcase') effectivePlayerCount = 3;
    else if (posterLayout === '4-player-showcase') effectivePlayerCount = 4;
    else effectivePlayerCount = Math.min(s.playerCount, 4);
  }

  const dataAttrs: Record<string, string> = {
    'data-count': String(s.template === 'performer' ? effectivePlayerCount : 2),
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

  // ── Section builders ──
  const buildHeader = () => topBarHtml;

  const buildTitleBlock = () => titleBlockHtml;

  const buildMatchdayContent = () => `
    <section class="card">
      ${s.matchHome ? `<p class="team">${esc(s.matchHome)}</p>` : ''}
      ${s.matchHome && s.matchAway ? `<div class="vs">vs</div>` : ''}
      ${s.matchAway ? `<p class="team">${esc(s.matchAway)}</p>` : ''}
      ${detailsGroup(s.details || [])}
    </section>`;

  const buildResultsContent = () => {
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
    return `<section class="list">${rows}</section>`;
  };

  const buildPerformerContent = () => {
    const count = effectivePlayerCount;
    const layout = posterLayout;

    if (layout === '1-player-hero') {
      const p = s.players[0] || { name: '', role: '', stat: '', photoDataUrl: '' };
      return `<section class="feature-grid performer-hero">
        <div class="player-card player-card-hero">
          <div class="player-photo player-photo-hero" style="--photo:${p.photoDataUrl ? `url('${p.photoDataUrl}')` : 'none'};--photo-zoom:100%;--photo-x:50%;--photo-y:20%"></div>
          <div class="player-info-overlay">
            <div class="role">${esc(p.role)}</div>
            <h3 class="name">${esc(p.name)}</h3>
            <div class="statline">${esc(p.stat)}</div>
          </div>
        </div>
      </section>`;
    }

    if (layout === '2-player-large') {
      return `<section class="feature-grid performer-2-large">
        ${s.players.slice(0, 2).map(p => `
        <div class="player-card player-card-2large">
          <div class="player-photo player-photo-2large" style="--photo:${p.photoDataUrl ? `url('${p.photoDataUrl}')` : 'none'};--photo-zoom:100%;--photo-x:50%;--photo-y:20%"></div>
          <div class="player-info">
            <div class="role">${esc(p.role)}</div>
            <div class="player-name">${esc(p.name)}</div>
            <div class="stat">${esc(p.stat)}</div>
          </div>
        </div>`).join('')}
      </section>`;
    }

    if (layout === '2-player') {
      return `<section class="feature-grid performer-2">
        ${s.players.slice(0, 2).map(p => `
        <div class="player-card player-card-2">
          <div class="player-photo player-photo-2" style="--photo:${p.photoDataUrl ? `url('${p.photoDataUrl}')` : 'none'};--photo-zoom:100%;--photo-x:50%;--photo-y:20%"></div>
          <div class="player-info">
            <div class="role">${esc(p.role)}</div>
            <div class="player-name">${esc(p.name)}</div>
            <div class="stat">${esc(p.stat)}</div>
          </div>
        </div>`).join('')}
      </section>`;
    }

    if (layout === '3-player') {
      return `<section class="feature-grid performer-3">
        ${s.players.slice(0, 3).map(p => `
        <div class="player-card player-card-3">
          <div class="player-photo player-photo-3" style="--photo:${p.photoDataUrl ? `url('${p.photoDataUrl}')` : 'none'};--photo-zoom:100%;--photo-x:50%;--photo-y:20%"></div>
          <div class="player-info">
            <div class="role">${esc(p.role)}</div>
            <div class="player-name">${esc(p.name)}</div>
            <div class="stat">${esc(p.stat)}</div>
          </div>
        </div>`).join('')}
      </section>`;
    }

    // Showcase layouts: full-bleed photos top, stats grid below
    const roleIcons: Record<string, string> = {
      'batsman': '🏏', 'bowler': '⚾', 'all-rounder': '⚡', 'wicket-keeper': '🧤',
      'batting': '🏏', 'bowling': '⚾', 'fielding': '🌟', 'captain': '©️',
    };
    const getIcon = (role: string) => roleIcons[role.toLowerCase()] || '★';

    if (layout === '3-player-showcase') {
      const players = s.players.slice(0, 3);
      return `<section class="feature-grid performer-showcase performer-showcase-3">
        <div class="showcase-photos">
          ${players.map(p => `
          <div class="showcase-photo" style="--photo:${p.photoDataUrl ? `url('${p.photoDataUrl}')` : 'none'};--photo-x:50%;--photo-y:0%"></div>`).join('')}
        </div>
        <div class="showcase-stats">
          ${players.map(p => `
          <div class="showcase-stat">
            <div class="showcase-stat-icon">${getIcon(p.role)}</div>
            <div class="showcase-stat-name">${esc(p.name)}</div>
            <div class="showcase-stat-number">${esc(p.stat)}</div>
            <div class="showcase-stat-label">${esc(p.role)}</div>
          </div>`).join('')}
        </div>
      </section>`;
    }

    if (layout === '2-player-showcase') {
      const players = s.players.slice(0, 2);
      return `<section class="feature-grid performer-showcase performer-showcase-2">
        <div class="showcase-photos">
          ${players.map(p => `
          <div class="showcase-photo" style="--photo:${p.photoDataUrl ? `url('${p.photoDataUrl}')` : 'none'};--photo-x:50%;--photo-y:0%"></div>`).join('')}
        </div>
        <div class="showcase-stats">
          ${players.map(p => `
          <div class="showcase-stat">
            <div class="showcase-stat-icon">${getIcon(p.role)}</div>
            <div class="showcase-stat-name">${esc(p.name)}</div>
            <div class="showcase-stat-number">${esc(p.stat)}</div>
            <div class="showcase-stat-label">${esc(p.role)}</div>
          </div>`).join('')}
        </div>
      </section>`;
    }

    if (layout === '4-player-showcase') {
      const players = s.players.slice(0, 4);
      return `<section class="feature-grid performer-showcase performer-showcase-4">
        <div class="showcase-photos">
          ${players.map(p => `
          <div class="showcase-photo" style="--photo:${p.photoDataUrl ? `url('${p.photoDataUrl}')` : 'none'};--photo-x:50%;--photo-y:0%"></div>`).join('')}
        </div>
        <div class="showcase-stats">
          ${players.map(p => `
          <div class="showcase-stat">
            <div class="showcase-stat-icon">${getIcon(p.role)}</div>
            <div class="showcase-stat-name">${esc(p.name)}</div>
            <div class="showcase-stat-number">${esc(p.stat)}</div>
            <div class="showcase-stat-label">${esc(p.role)}</div>
          </div>`).join('')}
        </div>
      </section>`;
    }

    // default 4-player
    return `<section class="feature-grid performer-4">
      ${s.players.slice(0, count).map(p => `
      <div class="player-card player-card-4">
        <div class="player-photo player-photo-4" style="--photo:${p.photoDataUrl ? `url('${p.photoDataUrl}')` : 'none'};--photo-zoom:100%;--photo-x:50%;--photo-y:20%"></div>
        <div class="player-info">
          <div class="role">${esc(p.role)}</div>
          <div class="player-name">${esc(p.name)}</div>
          <div class="stat">${esc(p.stat)}</div>
        </div>
      </div>`).join('')}
    </section>`;
  };

  const buildSigningContent = () => `
    <section class="player-card">
      <div class="player-photo" style="--photo:${s.signingPhotoDataUrl ? `url('${s.signingPhotoDataUrl}')` : 'none'};--photo-zoom:100%;--photo-x:50%;--photo-y:20%"></div>
      <div class="player-copy">
        <div class="role">${esc(s.signingRole)}</div>
        <h3 class="name">${esc(s.signingName)}</h3>
        <div class="statline">${esc(s.signingNote)}</div>
      </div>
    </section>`;

  const buildFixturesContent = () => {
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
    return `<section class="list">${rows}</section>`;
  };

  const buildSquadContent = () => {
    const players = s.squadPlayers.slice(0, 14).map((p, i) => `
      <div class="row schedule-row">
        <div class="role">${String(i + 1).padStart(2, '0')}</div>
        <div class="row-main"><div class="row-title">${esc(typeof p === 'string' ? p : p.name)}</div></div>
      </div>`).join('');
    return `<section class="squad-layout"><div class="squad-grid">${players}</div></section>`;
  };

  const buildNoticeContent = () => `
    <section class="card">
      <p class="team" style="white-space:pre-line">${esc(s.noticeText)}</p>
    </section>`;

  // ── Sponsor wall — featured shows main sponsor on left ──
  const buildSponsorWall = (sponsors: typeof s.sponsors, layout: string) => {
    if (!sponsors.length) return '';
    const logoBox = (sp: typeof sponsors[0]) => sp.logo
      ? `<div class="logo-bg" style="background-image:url('${sp.logo}')"></div>`
      : `<div class="logo-bg text-only">${esc(sp.name)}</div>`;

    // featured: first sponsor is main (left), rest are partners (grid right)
    if (layout === 'featured' && sponsors.length >= 2) {
      const main = sponsors[0];
      const partners = sponsors.slice(1);
      const partnerCount = partners.length;
      const wallClass = `featured multi`;
      return `<div class="sponsor-wall ${wallClass}" data-count="${sponsors.length}" data-partners="${partnerCount}"><div class="sponsor-main">${logoBox(main)}</div><div class="sponsors">${partners.map(sp => `<div class="sponsor">${logoBox(sp)}</div>`).join('')}</div></div>`;
    }

    // all other layouts: no main, all equal
    const total = sponsors.length;
    const wallClass = `${layout} no-main`;
    return `<div class="sponsor-wall ${wallClass}" data-count="${total}"><div class="sponsor-main"></div><div class="sponsors">${sponsors.map(sp => `<div class="sponsor">${logoBox(sp)}</div>`).join('')}</div></div>`;
  };

  const buildSponsorContent = () => {
    if (!s.sponsors.length) return `<section class="partner-card"><div class="logo-bg text-only" style="min-height:120px;display:flex;align-items:center;justify-content:center;font-size:18px;opacity:0.5">Add your sponsor logos</div></section>`;
    return `<section class="partner-card">${buildSponsorWall(s.sponsors, s.sponsorLayout || 'featured')}</section>`;
  };

  const footerHtml = s.sponsors.length && s.template !== 'sponsor' ? `
    <footer class="footer">
      <div class="sponsor-title">Club Partners</div>
      ${buildSponsorWall(s.sponsors, s.sponsorLayout || 'featured')}
    </footer>` : '';

  // ── Section ordering ──
  const sectionOrder = s.sectionOrder || [];

  const buildContentSections = () => {
    const sections: string[] = [];
    for (const section of sectionOrder) {
      if (section === 'header') continue; // handled separately
      if (section === 'footer') continue; // handled separately
      if (section === 'title') {
        if (s.template === 'monthly') {
          const monthlyTitle = `<div class="title-block"><h2 class="title">${esc(s.titleTop || 'THIS MONTH\'S')}${s.titleBottom ? `<span>${esc(s.titleBottom)}</span>` : '<span>FIXTURES</span>'}</h2></div>`;
          sections.push(monthlyTitle);
        } else {
          sections.push(buildTitleBlock());
        }
      } else if (section === 'fixtures') {
        sections.push(buildFixturesContent());
      } else if (section === 'results') {
        sections.push(buildResultsContent());
      } else if (section === 'players') {
        sections.push(buildPerformerContent());
      } else if (section === 'player') {
        sections.push(buildSigningContent());
      } else if (section === 'squad') {
        sections.push(buildSquadContent());
      } else if (section === 'notice') {
        sections.push(buildNoticeContent());
      } else if (section === 'sponsors') {
        sections.push(buildSponsorContent());
      } else if (section === 'content') {
        sections.push(buildMatchdayContent());
      }
    }
    return sections.join('');
  };

  // For templates without sectionOrder, fall back to original behavior
  let contentHtml = '';
  if (sectionOrder.length > 0) {
    contentHtml = buildContentSections();
  } else {
    // Original fallback
    if (s.template === 'matchday' || s.template === 'custom') {
      contentHtml = `${titleBlockHtml}${buildMatchdayContent()}`;
    } else if (s.template === 'results') {
      contentHtml = `${titleBlockHtml}${buildResultsContent()}`;
    } else if (s.template === 'performer') {
      contentHtml = `${titleBlockHtml}${buildPerformerContent()}`;
    } else if (s.template === 'signing') {
      contentHtml = `${titleBlockHtml}${buildSigningContent()}`;
    } else if (s.template === 'monthly') {
      const monthlyTitle = `<div class="title-block"><h2 class="title">${esc(s.titleTop || 'THIS MONTH\'S')}${s.titleBottom ? `<span>${esc(s.titleBottom)}</span>` : '<span>FIXTURES</span>'}</h2></div>`;
      contentHtml = `${monthlyTitle}${buildFixturesContent()}`;
    } else if (s.template === 'weekend') {
      contentHtml = `${titleBlockHtml}${buildFixturesContent()}`;
    } else if (s.template === 'squad') {
      contentHtml = `${titleBlockHtml}${buildSquadContent()}`;
    } else if (s.template === 'notice') {
      contentHtml = `${titleBlockHtml}${buildNoticeContent()}`;
    } else if (s.template === 'sponsor') {
      contentHtml = `${titleBlockHtml}${buildSponsorContent()}`;
    }
  }

  const innerHtml = `
    <div class="poster-bg-image"></div>
    <div class="poster-inner">
      ${buildHeader()}
      <main class="content">${contentHtml}</main>
      ${footerHtml}
    </div>`;

  return (
    <div
      ref={ref}
      className={posterClass}
      style={{ ...(cssVars as CSSProperties), ...extraRatioStyle }}
      {...dataAttrs}
      dangerouslySetInnerHTML={{ __html: innerHtml }}
    />
  );
});

PosterRenderer.displayName = 'PosterRenderer';
export default PosterRenderer;
