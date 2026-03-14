// ════════════════════════════════════════════════════════
// home.js  |  Homepage renderer
// ════════════════════════════════════════════════════════

function renderPage(page, data) {
  if (page !== 'home') return;
  const { meta, knockout, batting, bowling, fielding, mvp, awards } = data;
  const el = id => document.getElementById(id);

  // ── Champion banner ──
  if (meta?.champion) {
    el('home-champion').innerHTML = `
      <div class="champion-banner">
        <span class="champion-trophy">🏆</span>
        <div>
          <strong>${meta.champion}</strong> are the
          <span style="color:var(--text-secondary)"> ${OCC.year} OCC Champions</span>
          ${meta.runnersUp ? `<span style="color:var(--text-muted)"> · Runners up: ${meta.runnersUp}</span>` : ''}
        </div>
      </div>`;
  } else {
    el('home-champion').innerHTML = '';
  }

  // ── Key matches ──
  const finalMatch = knockout?.matches?.find(m => m.stage === 'Final');
  const sf1 = knockout?.matches?.find(m => m.stage === 'Semi Final 1');
  let matchesHTML = '';
  if (finalMatch) matchesHTML += renderMatchCard(finalMatch, meta);
  if (sf1)        matchesHTML += renderMatchCard(sf1, meta);
  el('home-matches').innerHTML = matchesHTML || '<p style="color:var(--text-muted);font-size:13px">No match data available.</p>';

  // ── Stats snapshot ──
  const topBat  = batting?.players?.[0];
  const topBowl = bowling?.players?.[0];
  const bestEco  = bowling?.players?.slice().sort((a,b) => a.eco - b.eco)[0];
  const topMvp   = mvp?.players?.[0];
  el('home-stats').innerHTML = [
    topBat  ? statCard('Top Scorer',      topBat.runs,   'runs', topBat.name,  topBat.team)  : '',
    topBowl ? statCard('Top Wickets',     topBowl.wkts,  'wkts', topBowl.name, topBowl.team) : '',
    bestEco ? statCard('Best Economy',    bestEco.eco,   'eco',  bestEco.name, bestEco.team) : '',
    topMvp  ? statCard('Tournament MVP',  topMvp.total,  'pts',  topMvp.name,  topMvp.team)  : '',
  ].join('');

  // ── Format timeline ──
  if (meta?.format) {
    el('home-format').innerHTML = meta.format.map((s, i) =>
      `<div class="format-node">
        <div class="format-node-name">${s.name}</div>
        <div class="format-node-detail">${s.detail}</div>
      </div>${i < meta.format.length - 1 ? '<div class="format-arrow">→</div>' : ''}`
    ).join('');
  }

  // ── Hero KPIs ──
  const kpiEl = document.getElementById('hero-kpis');
  if (kpiEl && topBat && topBowl && topMvp) {
    kpiEl.innerHTML = `
      <div class="hero-kpi">
        <div class="hero-kpi-val">${topBat.runs}</div>
        <div class="hero-kpi-label">Top runs</div>
        <div class="hero-kpi-sub">${topBat.name}</div>
      </div>
      <div class="hero-kpi">
        <div class="hero-kpi-val">${topBowl.wkts}</div>
        <div class="hero-kpi-label">Top wickets</div>
        <div class="hero-kpi-sub">${topBowl.name}</div>
      </div>
      <div class="hero-kpi">
        <div class="hero-kpi-val">${topMvp.total.toFixed(1)}</div>
        <div class="hero-kpi-label">MVP points</div>
        <div class="hero-kpi-sub">${topMvp.name}</div>
      </div>`;
  }

  // ── Year badge ──
  el('home-year-badge').textContent = OCC.year;
}

function statCard(label, val, unit, player, team) {
  return `<div class="stat-card">
    <div class="card-label">${label}</div>
    <div><span class="stat-val">${val}</span><span class="stat-unit">${unit}</span></div>
    <div class="stat-player">${player}</div>
    <div class="stat-team">${team}</div>
  </div>`;
}
