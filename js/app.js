// ════════════════════════════════════════════════════════════
// OCC — app.js  |  Core utilities, data loading, year control
// ════════════════════════════════════════════════════════════

// ── CONFIG ──────────────────────────────────────────────────
// To add a new year (e.g. 2026):
//   1. Create data/2026/ folder with all JSON files
//   2. Add '2026' to YEARS array below
const YEARS = ['2025', '2024'];
const DEFAULT_YEAR = '2025';

// ── STATE ────────────────────────────────────────────────────
const OCC = {
  year: DEFAULT_YEAR,
  cache: {},          // { '2025': { meta, groups, knockout, batting, … } }
  teamColors: {},
};

// ── TEAM COLOR PALETTE ───────────────────────────────────────
const PALETTE = [
  '#e8820c','#22c55e','#3b82f6','#a855f7','#ef4444',
  '#06b6d4','#f59e0b','#ec4899','#10b981','#6366f1',
  '#f97316','#14b8a6','#8b5cf6','#84cc16','#0ea5e9','#f43f5e',
  '#d97706','#16a34a','#2563eb','#9333ea','#dc2626',
  '#0891b2','#d97706','#db2777',
];
let _colorIdx = 0;
function teamColor(name) {
  if (!OCC.teamColors[name]) {
    OCC.teamColors[name] = PALETTE[_colorIdx++ % PALETTE.length];
  }
  return OCC.teamColors[name];
}

// ── LOGO HELPER ──────────────────────────────────────────────
function teamLogoHTML(teamName, size = 'xs', meta = null) {
  const sizeMap = { xs: 22, sm: 20, md: 42 };
  const px = sizeMap[size] || 22;
  const logoFile = meta?.teamLogos?.[teamName];
  const color = teamColor(teamName);
  const initials = teamName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('');

  if (logoFile) {
    return `<img
      src="logos/${logoFile}"
      alt="${teamName}"
      class="team-logo-${size}"
      style="width:${px}px;height:${px}px"
      onerror="this.replaceWith(initialsEl('${initials}','${color}',${px}))"
    />`;
  }
  return `<span class="team-initials-${size}" style="background:${color}22;color:${color};width:${px}px;height:${px}px">${initials}</span>`;
}

// Called by onerror fallback
window.initialsEl = function(initials, color, px) {
  const el = document.createElement('span');
  el.className = 'team-initials-xs';
  el.style.cssText = `background:${color}22;color:${color};width:${px}px;height:${px}px`;
  el.textContent = initials;
  return el;
};

// ── DATA LOADING ─────────────────────────────────────────────
const DATA_FILES = ['meta', 'groups', 'knockout', 'batting', 'bowling', 'fielding', 'mvp', 'awards'];

async function loadYear(year) {
  if (OCC.cache[year]) return OCC.cache[year];
  const results = await Promise.all(
    DATA_FILES.map(f =>
      fetch(`data/${year}/${f}.json`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  );
  const data = {};
  DATA_FILES.forEach((f, i) => { data[f] = results[i]; });
  OCC.cache[year] = data;
  return data;
}

// ── YEAR SWITCHING ────────────────────────────────────────────
async function setYear(year) {
  OCC.year = year;

  // Update all year displays
  document.querySelectorAll('.year-display').forEach(el => el.textContent = year);
  document.querySelectorAll('.year-select').forEach(el => { el.value = year; });

  const data = await loadYear(year);
  if (data.meta) {
    const venueCity = data.meta.venue?.split(',')[1]?.trim() || '';
    document.querySelectorAll('.hero-eyebrow').forEach(el => el.textContent = `${data.meta.season} · ${venueCity}`);
    document.querySelectorAll('.hero-sub').forEach(el => el.textContent = data.meta.tagline);
    document.querySelectorAll('.nav-year, .year-display').forEach(el => el.textContent = year);
  }

  // Re-render current page
  const activePage = document.querySelector('.page-section.active');
  if (activePage) {
    const pageId = activePage.dataset.page;
    renderPage(pageId, data);
  }
}

// ── NAVIGATION ────────────────────────────────────────────────
function navigateTo(pageId) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const target = document.querySelector(`[data-page="${pageId}"]`);
  if (target) target.classList.add('active');

  const navLink = document.querySelector(`[data-nav="${pageId}"]`);
  if (navLink) navLink.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadYear(OCC.year).then(data => renderPage(pageId, data));
}

// ── GROUP TABLE RENDERER (shared) ────────────────────────────
function renderGroupTable(teams, meta) {
  const rows = teams.map(t => {
    const nrrClass = parseFloat(t.nrr) >= 0 ? 'nrr-pos' : 'nrr-neg';
    const logo = teamLogoHTML(t.name, 'xs', meta);
    const color = teamColor(t.name);
    return `<tr class="${t.pos === 1 ? 'top-row' : ''}">
      <td class="td-rank ${t.pos === 1 ? 'gold' : ''}">${t.pos}</td>
      <td class="td-name">
        <div class="team-badge">
          ${logo}
          <span>${t.name}${t.note ? `<small style="color:var(--text-muted);font-size:9px;margin-left:3px">(${t.note})</small>` : ''}</span>
        </div>
      </td>
      <td class="c">${t.m}</td>
      <td class="c">${t.w}</td>
      <td class="c">${t.l}</td>
      <td class="r ${nrrClass}">${t.nrr}</td>
      <td class="td-pts r">${t.pts}</td>
    </tr>`;
  }).join('');

  return `<div class="table-wrap">
    <table>
      <thead><tr>
        <th style="width:26px">#</th>
        <th>Team</th>
        <th class="c">M</th><th class="c">W</th><th class="c">L</th>
        <th class="r">NRR</th><th class="r">Pts</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// ── MATCH CARD RENDERER (shared) ─────────────────────────────
function renderMatchCard(m, meta) {
  const isWinner1 = m.winner === m.team1;
  const isWinner2 = m.winner === m.team2;
  const logo1 = teamLogoHTML(m.team1, 'sm', meta);
  const logo2 = teamLogoHTML(m.team2, 'sm', meta);

  return `<div class="match-card">
    <div class="match-status status-completed">${m.stage}</div>
    <div class="match-teams">
      <div class="match-side">
        <div class="match-team-name">${logo1} ${m.team1}</div>
        <div class="match-score ${isWinner1 ? 'winner' : ''}">${m.score1 || '—'}</div>
        <div class="match-overs">${m.overs1 ? m.overs1 + ' overs' : ''}</div>
      </div>
      <div class="match-vs">vs</div>
      <div class="match-side right">
        <div class="match-team-name" style="justify-content:flex-end">${m.team2} ${logo2}</div>
        <div class="match-score ${isWinner2 ? 'winner' : ''}">${m.score2 || '—'}</div>
        <div class="match-overs">${m.overs2 ? m.overs2 + ' overs' : ''}</div>
      </div>
    </div>
    ${m.result ? `<div class="match-result">${m.result}</div>` : ''}
    ${m.date ? `<div class="match-meta">${m.date} · ${m.venue || ''}</div>` : ''}
  </div>`;
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Build year selector options dynamically
  document.querySelectorAll('.year-select').forEach(sel => {
    sel.innerHTML = YEARS.map(y =>
      `<option value="${y}" ${y === DEFAULT_YEAR ? 'selected' : ''}>${y}</option>`
    ).join('');
    sel.addEventListener('change', e => setYear(e.target.value));
  });

  // Pre-load default year
  const data = await loadYear(DEFAULT_YEAR);

  // Seed team colors from all years (consistent across year switches)
  YEARS.forEach(yr => {
    if (OCC.cache[yr]?.meta?.teams) {
      OCC.cache[yr].meta.teams.forEach(t => teamColor(t));
    }
  });
  if (data.meta?.teams) data.meta.teams.forEach(t => teamColor(t));

  // Detect current page from filename
  const page = document.body.dataset.page || 'home';
  const navLink = document.querySelector(`[data-nav="${page}"]`);
  if (navLink) navLink.classList.add('active');

  // Initial render
  renderPage(page, data);
});
