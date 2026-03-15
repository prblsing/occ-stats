// ════════════════════════════════════════════════════════════
// OCC — app.js  |  Core utilities, data loading, year control
// ════════════════════════════════════════════════════════════

// ── CONFIG ──────────────────────────────────────────────────
// To add a new year (e.g. 2026):
//   1. Create data/2026/ folder with all JSON files
//   2. Add '2026' to YEARS array below
const YEARS = ['2025', '2024'];
const DEFAULT_YEAR = '2025';
const ALL_TIME_KEY  = 'all';

// ── STATE ────────────────────────────────────────────────────
const OCC = {
  year: DEFAULT_YEAR,
  cache: {},
  teamColors: {},
};

// ── TEAM COLOR PALETTE ───────────────────────────────────────
const PALETTE = [
  '#e8820c','#22c55e','#3b82f6','#a855f7','#ef4444',
  '#06b6d4','#f59e0b','#ec4899','#10b981','#6366f1',
  '#f97316','#14b8a6','#8b5cf6','#84cc16','#0ea5e9','#f43f5e',
  '#d97706','#16a34a','#2563eb','#9333ea','#dc2626','#0891b2','#db2777',
];
let _colorIdx = 0;
function teamColor(name) {
  if (!OCC.teamColors[name]) OCC.teamColors[name] = PALETTE[_colorIdx++ % PALETTE.length];
  return OCC.teamColors[name];
}

// ── LOGO HELPER ──────────────────────────────────────────────
function teamLogoHTML(teamName, size, meta) {
  size = size || 'xs';
  const sizeMap = { xs: 22, sm: 20, md: 42 };
  const px = sizeMap[size] || 22;
  let logoFile = meta && meta.teamLogos && meta.teamLogos[teamName];
  if (!logoFile) {
    for (var i = 0; i < YEARS.length; i++) {
      var m = OCC.cache[YEARS[i]] && OCC.cache[YEARS[i]].meta;
      if (m && m.teamLogos && m.teamLogos[teamName]) { logoFile = m.teamLogos[teamName]; break; }
    }
  }
  const color = teamColor(teamName);
  const initials = teamName.split(' ').map(function(w){ return w[0]; }).filter(Boolean).slice(0,2).join('');
  if (logoFile) {
    return '<img src="logos/' + logoFile + '" alt="' + teamName + '" class="team-logo-' + size + '" style="width:' + px + 'px;height:' + px + 'px" onerror="this.style.display=\'none\'" />';
  }
  return '<span class="team-initials-' + size + '" style="background:' + color + '22;color:' + color + ';width:' + px + 'px;height:' + px + 'px">' + initials + '</span>';
}

// ── DATA LOADING ─────────────────────────────────────────────
const DATA_FILES = ['meta', 'groups', 'knockout', 'batting', 'bowling', 'fielding', 'mvp', 'awards'];

async function loadYear(year) {
  if (year === ALL_TIME_KEY) return buildAllTimeData();
  if (OCC.cache[year]) return OCC.cache[year];
  const results = await Promise.all(
    DATA_FILES.map(f =>
      fetch('data/' + year + '/' + f + '.json').then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
    )
  );
  const data = {};
  DATA_FILES.forEach(function(f, i){ data[f] = results[i]; });
  OCC.cache[year] = data;
  return data;
}

async function loadAllYears() {
  await Promise.all(YEARS.map(yr => loadYear(yr)));
  YEARS.forEach(yr => { (OCC.cache[yr] && OCC.cache[yr].meta && OCC.cache[yr].meta.teams || []).forEach(t => teamColor(t)); });
}

// ── ALL-TIME AGGREGATED DATA ─────────────────────────────────
function buildAllTimeData() {
  // ---- BATTING ----
  const batMap = {};
  YEARS.forEach(yr => {
    ((OCC.cache[yr] && OCC.cache[yr].batting && OCC.cache[yr].batting.players) || []).forEach(p => {
      const key = p.name.toLowerCase().trim();
      if (!batMap[key]) {
        batMap[key] = Object.assign({}, p, { totalRuns: p.runs, appearances: p.matches, years: [yr] });
      } else {
        batMap[key].totalRuns   += p.runs;
        batMap[key].appearances += p.matches;
        batMap[key].hs           = Math.max(batMap[key].hs, p.hs);
        batMap[key]['100s']     += p['100s'];
        batMap[key]['50s']      += p['50s'];
        batMap[key]['4s']       += p['4s'];
        batMap[key]['6s']       += p['6s'];
        batMap[key].years.push(yr);
      }
    });
  });
  const allBatting = Object.values(batMap)
    .map(p => Object.assign({}, p, {
      runs: p.totalRuns, matches: p.appearances,
      avg: p.appearances ? +(p.totalRuns / p.appearances).toFixed(2) : 0,
      sr: 0
    }))
    .sort((a, b) => b.runs - a.runs);

  // ---- BOWLING ----
  const bowlMap = {};
  YEARS.forEach(yr => {
    ((OCC.cache[yr] && OCC.cache[yr].bowling && OCC.cache[yr].bowling.players) || []).forEach(p => {
      const key = p.name.toLowerCase().trim();
      if (!bowlMap[key]) {
        bowlMap[key] = Object.assign({}, p, { totalWkts: p.wkts, totalRuns: p.runs, totalOvers: p.overs, appearances: p.matches, years: [yr] });
      } else {
        bowlMap[key].totalWkts   += p.wkts;
        bowlMap[key].totalRuns   += p.runs;
        bowlMap[key].totalOvers  += p.overs;
        bowlMap[key].appearances += p.matches;
        bowlMap[key].maidens     += p.maidens;
        bowlMap[key].years.push(yr);
      }
    });
  });
  const allBowling = Object.values(bowlMap)
    .map(p => Object.assign({}, p, {
      wkts: p.totalWkts, runs: p.totalRuns, overs: +p.totalOvers.toFixed(1),
      matches: p.appearances,
      eco: p.totalOvers > 0 ? +(p.totalRuns / p.totalOvers).toFixed(2) : 0,
      avg: p.totalWkts  > 0 ? +(p.totalRuns / p.totalWkts).toFixed(2)  : 0,
      sr:  p.totalWkts  > 0 ? +(p.totalOvers * 6 / p.totalWkts).toFixed(2) : 0,
    }))
    .sort((a, b) => b.wkts - a.wkts);

  // ---- FIELDING ----
  const fieldMap = {};
  YEARS.forEach(yr => {
    ((OCC.cache[yr] && OCC.cache[yr].fielding && OCC.cache[yr].fielding.players) || []).forEach(p => {
      const key = p.name.toLowerCase().trim();
      if (!fieldMap[key]) {
        fieldMap[key] = Object.assign({}, p, { years: [yr] });
      } else {
        fieldMap[key].dismissals   += p.dismissals;
        fieldMap[key].catches      += p.catches;
        fieldMap[key].stumpings    += p.stumpings;
        fieldMap[key].caughtBehind += p.caughtBehind;
        fieldMap[key].runOuts      += p.runOuts;
        fieldMap[key].matches      += p.matches;
        fieldMap[key].years.push(yr);
      }
    });
  });
  const allFielding = Object.values(fieldMap).sort((a, b) => b.dismissals - a.dismissals);

  // ---- MVP ----
  const mvpMap = {};
  YEARS.forEach(yr => {
    ((OCC.cache[yr] && OCC.cache[yr].mvp && OCC.cache[yr].mvp.players) || []).forEach(p => {
      const key = p.name.toLowerCase().trim();
      if (!mvpMap[key]) {
        mvpMap[key] = Object.assign({}, p, { years: [yr] });
      } else {
        mvpMap[key].total   += p.total;
        mvpMap[key].batting += p.batting;
        mvpMap[key].bowling += p.bowling;
        mvpMap[key].fielding+= p.fielding;
        mvpMap[key].years.push(yr);
      }
    });
  });
  const allMvp = Object.values(mvpMap).sort((a, b) => b.total - a.total);

  return {
    meta: {
      year: 'All Time', season: 'All Editions',
      tagline: YEARS.length + ' seasons · ' + YEARS.join(', '),
      venue: 'Siditya Cricket Ground, Noida',
      champion: null, teams: [...new Set(YEARS.flatMap(yr => (OCC.cache[yr] && OCC.cache[yr].meta && OCC.cache[yr].meta.teams) || []))],
    },
    batting:  { players: allBatting  },
    bowling:  { players: allBowling  },
    fielding: { players: allFielding },
    mvp:      { players: allMvp      },
    groups: null, knockout: null, awards: null,
  };
}

// ── YEAR SWITCHING ────────────────────────────────────────────
async function setYear(year) {
  OCC.year = year;
  const label = year === ALL_TIME_KEY ? 'All' : year;
  document.querySelectorAll('.year-display, .nav-year').forEach(el => el.textContent = label);
  document.querySelectorAll('.year-select').forEach(el => { el.value = year; });

  let data;
  if (year === ALL_TIME_KEY) {
    await loadAllYears();
    data = buildAllTimeData();
  } else {
    data = await loadYear(year);
  }

  if (data.meta && year !== ALL_TIME_KEY) {
    const city = (data.meta.venue || '').split(',')[1] && (data.meta.venue || '').split(',')[1].trim() || '';
    document.querySelectorAll('.hero-eyebrow').forEach(el => el.textContent = data.meta.season + ' · ' + city);
    document.querySelectorAll('.hero-sub').forEach(el => el.textContent = data.meta.tagline);
  }

  const activePage = document.querySelector('.page-section.active');
  if (activePage) renderPage(activePage.dataset.page, data);
}

// ── NAVIGATION ────────────────────────────────────────────────
function navigateTo(pageId) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const target  = document.querySelector('[data-page="' + pageId + '"]');
  const navLink = document.querySelector('[data-nav="' + pageId + '"]');
  if (target)  target.classList.add('active');
  if (navLink) navLink.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadYear(OCC.year).then(data => renderPage(pageId, data));
}

// ── SHARED RENDERERS ─────────────────────────────────────────
function renderGroupTable(teams, meta) {
  const rows = teams.map(t => {
    const nrrClass = parseFloat(t.nrr) >= 0 ? 'nrr-pos' : 'nrr-neg';
    const logo = teamLogoHTML(t.name, 'xs', meta);
    return '<tr class="' + (t.pos===1?'top-row':'') + '">' +
      '<td class="td-rank ' + (t.pos===1?'gold':'') + '">' + t.pos + '</td>' +
      '<td class="td-name"><div class="team-badge">' + logo + '<span>' + t.name + (t.note ? '<small style="color:var(--text-muted);font-size:9px;margin-left:3px">(' + t.note + ')</small>' : '') + '</span></div></td>' +
      '<td class="c">' + t.m + '</td><td class="c">' + t.w + '</td><td class="c">' + t.l + '</td>' +
      '<td class="r ' + nrrClass + '">' + t.nrr + '</td><td class="td-pts r">' + t.pts + '</td></tr>';
  }).join('');
  return '<div class="table-wrap"><table><thead><tr><th style="width:26px">#</th><th>Team</th><th class="c">M</th><th class="c">W</th><th class="c">L</th><th class="r">NRR</th><th class="r">Pts</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function renderMatchCard(m, meta) {
  const isW1 = m.winner === m.team1, isW2 = m.winner === m.team2;
  const l1 = teamLogoHTML(m.team1, 'sm', meta), l2 = teamLogoHTML(m.team2, 'sm', meta);
  return '<div class="match-card">' +
    '<div class="match-status status-completed">' + m.stage + '</div>' +
    '<div class="match-teams">' +
      '<div class="match-side"><div class="match-team-name">' + l1 + ' ' + m.team1 + '</div>' +
        '<div class="match-score ' + (isW1?'winner':'') + '">' + (m.score1||'—') + '</div>' +
        '<div class="match-overs">' + (m.overs1 ? m.overs1 + ' overs' : '') + '</div></div>' +
      '<div class="match-vs">vs</div>' +
      '<div class="match-side right"><div class="match-team-name" style="justify-content:flex-end">' + m.team2 + ' ' + l2 + '</div>' +
        '<div class="match-score ' + (isW2?'winner':'') + '">' + (m.score2||'—') + '</div>' +
        '<div class="match-overs">' + (m.overs2 ? m.overs2 + ' overs' : '') + '</div></div>' +
    '</div>' +
    (m.result ? '<div class="match-result">' + m.result + '</div>' : '') +
    (m.date   ? '<div class="match-meta">' + m.date + ' · ' + (m.venue||'') + '</div>' : '') +
  '</div>';
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
  // Build year selector with All Time option
  document.querySelectorAll('.year-select').forEach(sel => {
    sel.innerHTML =
      YEARS.map(y => '<option value="' + y + '"' + (y===DEFAULT_YEAR?' selected':'') + '>' + y + '</option>').join('') +
      '<option value="' + ALL_TIME_KEY + '">All Time</option>';
    sel.addEventListener('change', function(e){ setYear(e.target.value); });
  });

  // Load default year
  const data = await loadYear(DEFAULT_YEAR);
  if (data.meta && data.meta.teams) data.meta.teams.forEach(t => teamColor(t));

  // Awards page: eagerly load ALL years so Hall of Fame is complete on first render
  const page = document.body.dataset.page || 'home';
  if (page === 'awards') await loadAllYears();

  const navLink = document.querySelector('[data-nav="' + page + '"]');
  if (navLink) navLink.classList.add('active');

  renderPage(page, data);
});
