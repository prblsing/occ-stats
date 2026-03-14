// ════════════════════════════════════════════════════════
// awards.js  |  Awards & Hall of Fame renderer
// ════════════════════════════════════════════════════════

function renderPage(page, data) {
  if (page !== 'awards') return;
  const { meta, awards, batting, bowling } = data;
  const el = document.getElementById('awards-content');
  if (!el) return;

  let html = '<div class="page-content">';

  // Champion banner
  if (meta?.champion) {
    html += `<div class="champion-banner" style="margin-bottom:20px">
      <span class="champion-trophy">🏆</span>
      <div>
        <strong>${meta.champion}</strong> — ${OCC.year} OCC Champions
        <span style="color:var(--text-muted)"> · ${meta.venue || 'Siditya Cricket Ground, Noida'}</span>
      </div>
    </div>`;
  }

  // Awards grid
  if (awards?.awards?.length) {
    html += `<div class="section-header"><div class="section-title">Season ${OCC.year} Awards</div></div>`;
    html += `<div class="grid-3" style="margin-bottom:28px">`;
    awards.awards.forEach(a => {
      html += `<div class="award-card">
        <div class="award-icon">${a.icon}</div>
        <div class="award-title">${a.title}</div>
        <div class="award-winner">${a.winner}</div>
        <div class="award-detail">${a.detail}</div>
        ${a.team ? `<div class="award-team">${a.team}</div>` : ''}
      </div>`;
    });
    html += `</div>`;
  }

  // All-time Hall of Fame
  html += `<div class="section-header"><div class="section-title">Hall of Fame — All Editions</div></div>`;
  html += `<div class="table-wrap">
    <table>
      <thead><tr>
        <th>Year</th>
        <th>🏆 Champions</th>
        <th>🥈 Runners Up</th>
        <th>🥉 3rd Place</th>
        <th>Top Scorer</th>
        <th>Top Bowler</th>
        <th>MVP</th>
      </tr></thead>
      <tbody>`;

  // Pull from all cached years
  const allYears = Object.keys(OCC.cache).sort((a, b) => b - a);
  allYears.forEach(yr => {
    const d = OCC.cache[yr];
    if (!d?.meta) return;
    const topBat  = d.batting?.players?.[0];
    const topBowl = d.bowling?.players?.[0];
    const topMvp  = d.mvp?.players?.[0];
    const logo_champ = d.meta.champion ? teamLogoHTML(d.meta.champion, 'xs', d.meta) : '';
    html += `<tr>
      <td class="td-pts" style="font-family:'Bebas Neue',sans-serif;font-size:18px">${yr}</td>
      <td class="td-name">
        <div class="team-badge">${logo_champ}<span>${d.meta.champion || '—'}</span></div>
      </td>
      <td style="color:var(--text-secondary);font-size:12px">${d.meta.runnersUp || '—'}</td>
      <td style="color:var(--text-secondary);font-size:12px">${d.meta.thirdPlace || '—'}</td>
      <td style="color:var(--text-secondary);font-size:12px">${topBat ? `${topBat.name} (${topBat.runs} runs)` : '—'}</td>
      <td style="color:var(--text-secondary);font-size:12px">${topBowl ? `${topBowl.name} (${topBowl.wkts} wkts)` : '—'}</td>
      <td style="color:var(--text-secondary);font-size:12px">${topMvp ? `${topMvp.name} (${topMvp.total.toFixed(1)} pts)` : '—'}</td>
    </tr>`;
  });

  html += `</tbody></table></div>`;
  html += '</div>';
  el.innerHTML = html;
  document.getElementById('awards-badge').textContent = OCC.year;
}
