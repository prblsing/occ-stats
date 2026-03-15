// ════════════════════════════════════════════════════════════
// awards.js  |  Awards & Hall of Fame renderer
// ════════════════════════════════════════════════════════════

function renderPage(page, data) {
  if (page !== 'awards') return;

  // Always ensure all years are loaded before rendering (handles direct page load)
  loadAllYears().then(function() {
    _renderAwards(data);
  });
}

function _renderAwards(data) {
  const meta   = data.meta;
  const awards = data.awards;
  const el     = document.getElementById('awards-content');
  if (!el) return;

  const isAllTime = OCC.year === ALL_TIME_KEY;
  let html = '<div class="page-content">';

  // ── Champion banner (season view only) ──
  if (!isAllTime && meta && meta.champion) {
    html += '<div class="champion-banner" style="margin-bottom:20px">' +
      '<span class="champion-trophy">🏆</span>' +
      '<div><strong>' + meta.champion + '</strong> — ' + OCC.year + ' OCC Champions' +
      '<span style="color:var(--text-muted)"> · ' + (meta.venue || 'Siditya Cricket Ground, Noida') + '</span></div>' +
      '</div>';
  }

  // ── Season awards grid (season view only) ──
  if (!isAllTime && awards && awards.awards && awards.awards.length) {
    html += '<div class="section-header"><div class="section-title">Season ' + OCC.year + ' Awards</div></div>';
    html += '<div class="grid-3" style="margin-bottom:32px">';
    awards.awards.forEach(function(a) {
      html += '<div class="award-card">' +
        '<div class="award-icon">' + a.icon + '</div>' +
        '<div class="award-title">' + a.title + '</div>' +
        '<div class="award-winner">' + a.winner + '</div>' +
        '<div class="award-detail">' + a.detail + '</div>' +
        (a.team ? '<div class="award-team">' + a.team + '</div>' : '') +
        '</div>';
    });
    html += '</div>';
  }

  // ── Hall of Fame — always shown, all years ──
  html += '<div class="section-header"><div class="section-title">Hall of Fame — All Editions</div></div>';
  html += '<div class="table-wrap" style="margin-bottom:28px"><table>' +
    '<thead><tr>' +
    '<th>Year</th>' +
    '<th>🏆 Champions</th>' +
    '<th>🥈 Runners Up</th>' +
    '<th>🥉 3rd Place</th>' +
    '<th>Top Scorer</th>' +
    '<th>Top Bowler</th>' +
    '<th>MVP</th>' +
    '</tr></thead><tbody>';

  YEARS.slice().sort(function(a,b){ return b-a; }).forEach(function(yr) {
    const d = OCC.cache[yr];
    if (!d || !d.meta) return;
    const topBat  = d.batting  && d.batting.players  && d.batting.players[0];
    const topBowl = d.bowling  && d.bowling.players  && d.bowling.players[0];
    const topMvp  = d.mvp      && d.mvp.players      && d.mvp.players[0];
    const logo    = d.meta.champion ? teamLogoHTML(d.meta.champion, 'xs', d.meta) : '';
    const isCurrentYear = yr === OCC.year;

    html += '<tr' + (isCurrentYear && !isAllTime ? ' class="top-row"' : '') + '>' +
      '<td class="td-pts" style="font-family:\'Bebas Neue\',sans-serif;font-size:18px">' + yr + '</td>' +
      '<td class="td-name"><div class="team-badge">' + logo + '<span>' + (d.meta.champion || '—') + '</span></div></td>' +
      '<td style="color:var(--text-secondary);font-size:12px">' + (d.meta.runnersUp  || '—') + '</td>' +
      '<td style="color:var(--text-secondary);font-size:12px">' + (d.meta.thirdPlace || '—') + '</td>' +
      '<td style="color:var(--text-secondary);font-size:12px">' + (topBat  ? topBat.name  + ' <span style="color:var(--orange);font-weight:600">' + topBat.runs  + '</span> runs'  : '—') + '</td>' +
      '<td style="color:var(--text-secondary);font-size:12px">' + (topBowl ? topBowl.name + ' <span style="color:var(--orange);font-weight:600">' + topBowl.wkts + '</span> wkts' : '—') + '</td>' +
      '<td style="color:var(--text-secondary);font-size:12px">' + (topMvp  ? topMvp.name  + ' <span style="color:var(--orange);font-weight:600">' + topMvp.total.toFixed(1) + '</span> pts' : '—') + '</td>' +
      '</tr>';
  });

  html += '</tbody></table></div>';

  // ── All-time records section ──
  html += '<div class="section-header"><div class="section-title">All-Time Records</div></div>';
  html += '<div class="grid-3" style="margin-bottom:12px">';

  // Collect records across all cached years
  let mostRuns = null, mostWkts = null, bestEco = null, mostDismissals = null, topMvpAllTime = null;
  YEARS.forEach(function(yr) {
    const d = OCC.cache[yr];
    if (!d) return;
    const bat   = d.batting  && d.batting.players;
    const bowl  = d.bowling  && d.bowling.players;
    const field = d.fielding && d.fielding.players;
    const mvp   = d.mvp      && d.mvp.players;
    if (bat   && bat[0]   && (!mostRuns       || bat[0].runs         > mostRuns.runs))        { mostRuns       = Object.assign({}, bat[0],   {_yr: yr}); }
    if (bowl  && bowl[0]  && (!mostWkts       || bowl[0].wkts        > mostWkts.wkts))        { mostWkts       = Object.assign({}, bowl[0],  {_yr: yr}); }
    if (field && field[0] && (!mostDismissals || field[0].dismissals > mostDismissals.dismissals)) { mostDismissals = Object.assign({}, field[0], {_yr: yr}); }
    if (mvp   && mvp[0]   && (!topMvpAllTime  || mvp[0].total        > (topMvpAllTime.total||0)))  { topMvpAllTime  = Object.assign({}, mvp[0],  {_yr: yr}); }
    // Best economy (min 5 wickets)
    const qualified = bowl ? bowl.filter(function(p){ return p.wkts >= 5; }) : [];
    const cheapest = qualified.sort(function(a,b){ return a.eco - b.eco; })[0];
    if (cheapest && (!bestEco || cheapest.eco < bestEco.eco)) { bestEco = Object.assign({}, cheapest, {_yr: yr}); }
  });

  const records = [
    { icon: '🏏', label: 'Most runs (single season)', val: mostRuns ? mostRuns.runs + ' runs' : '—', name: mostRuns ? mostRuns.name : '', team: mostRuns ? mostRuns.team + ' · ' + mostRuns._yr : '' },
    { icon: '🎳', label: 'Most wickets (single season)', val: mostWkts ? mostWkts.wkts + ' wkts' : '—', name: mostWkts ? mostWkts.name : '', team: mostWkts ? mostWkts.team + ' · ' + mostWkts._yr : '' },
    { icon: '🎯', label: 'Best economy (min 5 wkts)', val: bestEco ? bestEco.eco + ' eco' : '—', name: bestEco ? bestEco.name : '', team: bestEco ? bestEco.team + ' · ' + bestEco._yr : '' },
    { icon: '🧤', label: 'Most dismissals (single season)', val: mostDismissals ? mostDismissals.dismissals + ' dismissals' : '—', name: mostDismissals ? mostDismissals.name : '', team: mostDismissals ? mostDismissals.team + ' · ' + mostDismissals._yr : '' },
    { icon: '⭐', label: 'Highest MVP score', val: topMvpAllTime ? topMvpAllTime.total.toFixed(2) + ' pts' : '—', name: topMvpAllTime ? topMvpAllTime.name : '', team: topMvpAllTime ? topMvpAllTime.team + ' · ' + topMvpAllTime._yr : '' },
    { icon: '🏆', label: 'Most titles', val: (() => {
        const wins = {};
        YEARS.forEach(yr => { const c = OCC.cache[yr] && OCC.cache[yr].meta && OCC.cache[yr].meta.champion; if (c) wins[c] = (wins[c]||0) + 1; });
        const top = Object.entries(wins).sort((a,b)=>b[1]-a[1])[0];
        return top ? top[1] + (top[1]===1?' title':' titles') : '—';
      })(), name: (() => {
        const wins = {};
        YEARS.forEach(yr => { const c = OCC.cache[yr] && OCC.cache[yr].meta && OCC.cache[yr].meta.champion; if (c) wins[c] = (wins[c]||0) + 1; });
        const top = Object.entries(wins).sort((a,b)=>b[1]-a[1])[0];
        return top ? top[0] : '';
      })(), team: '' },
  ];

  records.forEach(function(r) {
    html += '<div class="award-card">' +
      '<div class="award-icon">' + r.icon + '</div>' +
      '<div class="award-title">' + r.label + '</div>' +
      '<div class="award-winner" style="font-size:16px">' + r.name + '</div>' +
      '<div class="award-detail">' + r.val + '</div>' +
      (r.team ? '<div class="award-team">' + r.team + '</div>' : '') +
      '</div>';
  });

  html += '</div>';
  html += '</div>';
  el.innerHTML = html;
  document.getElementById('awards-badge').textContent = OCC.year === ALL_TIME_KEY ? 'All' : OCC.year;
}
