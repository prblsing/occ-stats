/* ================================================================
   OCC CRICKET PORTAL — Core JS Engine
   Handles: data loading, year state, computed stats, shared UI
   ================================================================ */

const OCC = (() => {

  // ── State ──────────────────────────────────────────────────────
  let _seasons = [];
  let _currentYear = null;
  let _data = {};  // keyed by year
  let _onYearChange = [];

  // ── Constants ─────────────────────────────────────────────────
  const SEASONS_INDEX = 'data/seasons.json';

  // ── Init ──────────────────────────────────────────────────────
  async function init(defaultYear) {
    const idx = await fetchJSON(SEASONS_INDEX);
    _seasons = idx.seasons;
    _currentYear = defaultYear || idx.currentYear;

    // Preload all seasons
    await Promise.all(_seasons.map(s => loadSeason(s.year)));

    return _currentYear;
  }

  // ── Load a season ─────────────────────────────────────────────
  async function loadSeason(year) {
    if (_data[year]) return _data[year];
    const s = _seasons.find(s => s.year === year);
    if (!s) return null;
    const raw = await fetchJSON(s.file);
    _data[year] = processData(raw);
    return _data[year];
  }

  // ── Process / enrich raw data ──────────────────────────────────
  function processData(raw) {
    const teamMap = {};
    raw.teams.forEach(t => teamMap[t.id] = t);

    const playerMap = {};
    raw.players.forEach(p => {
      p.teamObj = teamMap[p.team] || {};
      // Computed batting
      p.avg     = p.matches > 0 ? +(p.runs / Math.max(p.matches, 1)).toFixed(1) : 0;
      p.sr      = p.balls_faced > 0 ? +((p.runs / p.balls_faced) * 100).toFixed(1) : 0;
      // Computed bowling
      if (p.overs > 0) {
        const balls = p.overs * 6;
        p.economy = +((p.runs_given / p.overs)).toFixed(2);
        p.bowl_avg = p.wickets > 0 ? +(p.runs_given / p.wickets).toFixed(1) : null;
        p.bowl_sr  = p.wickets > 0 ? +((balls / p.wickets)).toFixed(1) : null;
      } else {
        p.economy = null; p.bowl_avg = null; p.bowl_sr = null;
      }
      // Fielding total
      p.dismissals = (p.catches || 0) + (p.stumpings || 0) + (p.runouts || 0);
      playerMap[p.id] = p;
    });

    // Enrich matches
    raw.matches.forEach(m => {
      m.team1Obj = teamMap[m.team1] || {};
      m.team2Obj = teamMap[m.team2] || {};
      m.momObj   = m.mom ? playerMap[m.mom] : null;
      const d    = new Date(m.date);
      m.dateObj  = d;
      m.dateStr  = d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
      m.dateFmt  = d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
    });

    // Cap leaders
    const batters  = [...raw.players].sort((a,b) => b.runs - a.runs);
    const bowlers  = [...raw.players].filter(p => p.wickets > 0).sort((a,b) => b.wickets - a.wickets);

    return {
      ...raw,
      teamMap,
      playerMap,
      orangeCap:  batters[0]  || null,
      purpleCap:  bowlers[0]  || null,
      batters,
      bowlers,
      sortedTeams: [...raw.teams].sort((a,b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        return parseFloat(b.nrr) - parseFloat(a.nrr);
      }),
      completedMatches: raw.matches.filter(m => m.status === 'completed'),
      upcomingMatches:  raw.matches.filter(m => m.status === 'upcoming'),
    };
  }

  // ── Year switching ────────────────────────────────────────────
  function setYear(year) {
    _currentYear = year;
    _onYearChange.forEach(fn => fn(year, getData()));
  }

  function getYear() { return _currentYear; }

  function getData(year) {
    return _data[year || _currentYear] || null;
  }

  function getSeasons() { return _seasons; }

  function onYearChange(fn) { _onYearChange.push(fn); }

  // ── Utilities ─────────────────────────────────────────────────
  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Failed to fetch ${url}`);
    return r.json();
  }

  function fmtDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  }

  return { init, setYear, getYear, getData, getSeasons, onYearChange, fmtDate };
})();

/* ================================================================
   SHARED RENDER HELPERS
   ================================================================ */

const Render = (() => {

  function teamDot(team) {
    return `<span class="team-dot" style="background:${team?.color||'#888'}"></span>`;
  }

  function teamAvatar(team) {
    const color = team?.color || '#888';
    return `<div class="team-avatar" style="background:${color}">${team?.short || '??'}</div>`;
  }

  // ── Cap Cards ──
  function capCards(orangeCap, purpleCap) {
    return `
      <div class="caps-grid">
        ${capCard(orangeCap, 'orange', '🧡', 'Orange Cap', 'runs', 'Runs')}
        ${capCard(purpleCap, 'purple', '💜', 'Purple Cap', 'wickets', 'Wickets')}
      </div>`;
  }

  function capCard(player, type, emoji, label, statKey, statLabel) {
    if (!player) return `<div class="cap-card ${type}-cap"><div class="cap-body"><div class="cap-label">${label}</div><div class="cap-name text-muted">No data</div></div></div>`;
    return `
      <div class="cap-card ${type}-cap">
        <div class="cap-icon">${emoji}</div>
        <div class="cap-body">
          <div class="cap-label">${label}</div>
          <div class="cap-name">${player.name}</div>
          <div class="cap-team">${player.teamObj?.name || player.team} · ${player.role}</div>
        </div>
        <div>
          <div class="cap-stat">${player[statKey]}</div>
          <div class="cap-stat-lbl">${statLabel}</div>
        </div>
      </div>`;
  }

  // ── Points Table ──
  function pointsTable(teams) {
    const rows = teams.map((t, i) => {
      const nrrClass = parseFloat(t.nrr) >= 0 ? 'pos' : 'neg';
      const rowClass = i < 2 ? 'qualify' : (i === teams.length - 1 ? 'danger' : '');
      return `
        <tr class="${rowClass}">
          <td>
            <div class="team-cell">
              ${teamDot(t)}
              <span class="team-full">${t.name}</span>
              <span class="team-short">${t.short}</span>
            </div>
          </td>
          <td class="pts-val">${t.played}</td>
          <td class="pts-val text-green">${t.won}</td>
          <td class="pts-val text-red">${t.lost}</td>
          <td class="pts-val">${t.tied}</td>
          <td class="pts-pts">${t.pts}</td>
          <td class="pts-nrr ${nrrClass}">${t.nrr}</td>
        </tr>`;
    }).join('');

    return `
      <div class="points-table-wrap">
        <table class="pts-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>L</th>
              <th>T</th>
              <th>Pts</th>
              <th>NRR</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // ── Match Card ──
  function matchCard(m, teamMap) {
    const t1 = teamMap[m.team1] || {};
    const t2 = teamMap[m.team2] || {};
    const isUpcoming = m.status === 'upcoming';
    const t1Win = m.winner === m.team1;
    const t2Win = m.winner === m.team2;

    const scoreEl = (score, isWinner, isUpcoming) => {
      if (isUpcoming) return `<div class="mt-score upcoming-score">TBD</div>`;
      return `<div class="mt-score ${isWinner ? 'winner-score' : ''}">${score || '—'}</div>`;
    };

    const resultLine = isUpcoming
      ? `<div class="match-result"><span style="color:var(--text-3);font-style:italic">Upcoming</span><span class="mom">${m.dateStr}</span></div>`
      : `<div class="match-result">
          <span>${m.winner ? `<span class="winner-name">${teamMap[m.winner]?.name || m.winner}</span> · ${m.margin}` : 'Match Tied'}</span>
          ${m.momObj ? `<span class="mom">MOM: ${m.momObj.name}</span>` : ''}
        </div>`;

    return `
      <div class="match-card ${isUpcoming ? 'upcoming' : ''} fade-in">
        <div class="match-card-head">
          <span class="match-num">Match ${m.number}</span>
          <span class="match-venue">${m.venue}</span>
          <span class="match-date">${m.dateFmt}</span>
        </div>
        <div class="match-card-body">
          <div class="match-teams">
            <div class="match-team home">
              <div class="mt-name" style="color:${t1.color||'inherit'}">${t1.short || m.team1}</div>
              ${scoreEl(m.score1, t1Win, isUpcoming)}
            </div>
            <div class="vs-divider">VS</div>
            <div class="match-team away">
              <div class="mt-name" style="color:${t2.color||'inherit'}">${t2.short || m.team2}</div>
              ${scoreEl(m.score2, t2Win, isUpcoming)}
            </div>
          </div>
          ${resultLine}
        </div>
      </div>`;
  }

  // ── Batting Table ──
  function battingTable(players, sortKey = 'runs') {
    const sorted = [...players].sort((a,b) => b[sortKey] - a[sortKey]);
    const cols = [
      { key:'runs',    label:'Runs',  isSorted: sortKey==='runs' },
      { key:'matches', label:'M',     isSorted: sortKey==='matches' },
      { key:'hs',      label:'HS',    isSorted: sortKey==='hs' },
      { key:'avg',     label:'Avg',   isSorted: sortKey==='avg' },
      { key:'sr',      label:'SR',    isSorted: sortKey==='sr' },
      { key:'hundreds',label:'100s',  isSorted: sortKey==='hundreds' },
      { key:'fifties', label:'50s',   isSorted: sortKey==='fifties' },
    ];

    const rows = sorted.map((p, i) => `
      <tr>
        <td><span class="rank-num">${i+1}</span></td>
        <td>
          <div class="player-cell">
            <div class="p-name">${p.name}</div>
            <div class="p-team">${p.teamObj?.name || p.team} · ${p.role}</div>
          </div>
        </td>
        <td class="${i===0?'top-val':'highlight'}">${p.runs}</td>
        <td>${p.matches}</td>
        <td>${p.hs}</td>
        <td>${p.avg}</td>
        <td>${p.sr}</td>
        <td>${p.hundreds || 0}</td>
        <td>${p.fifties || 0}</td>
      </tr>`).join('');

    return `
      <div class="table-card">
        <div class="table-scroll">
          <table class="stats-table" data-sort="runs">
            <thead>
              <tr>
                <th style="width:40px">#</th>
                <th>Player</th>
                ${cols.map(c => `<th class="${c.isSorted?'sorted':''}" data-col="${c.key}">${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }

  // ── Bowling Table ──
  function bowlingTable(players, sortKey = 'wickets') {
    const bowlers = players.filter(p => p.wickets > 0 || p.overs > 0);
    const sorted  = [...bowlers].sort((a,b) => b[sortKey] - a[sortKey]);
    const cols = [
      { key:'wickets',  label:'Wkts',  isSorted: sortKey==='wickets' },
      { key:'matches',  label:'M',     isSorted: sortKey==='matches' },
      { key:'overs',    label:'O',     isSorted: sortKey==='overs' },
      { key:'runs_given',label:'R',    isSorted: sortKey==='runs_given' },
      { key:'economy',  label:'Econ',  isSorted: sortKey==='economy' },
      { key:'bowl_avg', label:'Avg',   isSorted: sortKey==='bowl_avg' },
      { key:'maidens',  label:'Md',    isSorted: sortKey==='maidens' },
    ];

    const rows = sorted.map((p, i) => `
      <tr>
        <td><span class="rank-num">${i+1}</span></td>
        <td>
          <div class="player-cell">
            <div class="p-name">${p.name}</div>
            <div class="p-team">${p.teamObj?.name || p.team} · ${p.role}</div>
          </div>
        </td>
        <td class="${i===0?'top-val':'highlight'}">${p.wickets}</td>
        <td>${p.matches}</td>
        <td>${p.overs}</td>
        <td>${p.runs_given}</td>
        <td>${p.economy ?? '—'}</td>
        <td>${p.bowl_avg ?? '—'}</td>
        <td>${p.maidens}</td>
      </tr>`).join('');

    return `
      <div class="table-card">
        <div class="table-scroll">
          <table class="stats-table" data-sort="wickets">
            <thead>
              <tr>
                <th style="width:40px">#</th>
                <th>Player</th>
                ${cols.map(c => `<th class="${c.isSorted?'sorted':''}" data-col="${c.key}">${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }

  // ── Fielding Table ──
  function fieldingTable(players) {
    const sorted = [...players].sort((a,b) => b.dismissals - a.dismissals);
    const rows = sorted.map((p, i) => `
      <tr>
        <td><span class="rank-num">${i+1}</span></td>
        <td>
          <div class="player-cell">
            <div class="p-name">${p.name}</div>
            <div class="p-team">${p.teamObj?.name || p.team} · ${p.role}</div>
          </div>
        </td>
        <td class="${i===0?'top-val':'highlight'}">${p.dismissals}</td>
        <td>${p.catches}</td>
        <td>${p.stumpings}</td>
        <td>${p.runouts}</td>
        <td>${p.matches}</td>
      </tr>`).join('');

    return `
      <div class="table-card">
        <div class="table-scroll">
          <table class="stats-table">
            <thead>
              <tr>
                <th style="width:40px">#</th>
                <th>Player</th>
                <th>Total</th>
                <th>Ct</th>
                <th>St</th>
                <th>RO</th>
                <th>M</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }

  return { teamDot, teamAvatar, capCards, pointsTable, matchCard, battingTable, bowlingTable, fieldingTable };
})();

/* ================================================================
   SHARED UI — Nav, Year Pills, Mobile Menu
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('.nav-link').forEach(a => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        nav.classList.remove('open');
      });
    });
  }

  // Active nav link
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (!page && href === 'index.html')) a.classList.add('active');
  });
});
