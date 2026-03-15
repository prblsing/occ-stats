// ════════════════════════════════════════════════════════
// stats.js  |  Player Statistics renderer
// ════════════════════════════════════════════════════════

let _activeStatTab = 'batting';

function renderPage(page, data) {
  if (page !== 'stats') return;
  renderStatTab(_activeStatTab, data);
  document.getElementById('stats-badge').textContent = OCC.year;
}

function switchStatTab(tab) {
  _activeStatTab = tab;
  document.querySelectorAll('#stats-tabs .tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`#stats-tabs [data-tab="${tab}"]`).classList.add('active');
  loadYear(OCC.year).then(data => renderStatTab(tab, data));
}

function renderStatTab(tab, data) {
  const el = document.getElementById('stats-content');
  if (!el) return;
  const isAllTime = OCC.year === ALL_TIME_KEY;
  const { meta, batting, bowling, fielding, mvp } = data;

  // Show an info banner when in all-time mode
  let bannerHtml = '';
  if (isAllTime) {
    bannerHtml = '<div style="background:rgba(232,130,12,0.08);border:1px solid rgba(232,130,12,0.2);border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:var(--text-secondary)">' +
      '📊 Showing aggregated stats across all ' + YEARS.length + ' editions (' + YEARS.join(', ') + '). ' +
      'Runs and wickets are career totals; averages are recalculated across all appearances.' +
      '</div>';
  }
  let html = '<div class="page-content">';

  if (tab === 'batting' && batting?.players) {
    html += bannerHtml;
    html += `<div class="table-wrap">
      <table>
        <thead><tr>
          <th style="width:26px">#</th>
          <th>Player</th>
          <th>Team</th>
          <th class="r">Runs</th>
          <th class="r">HS</th>
          <th class="r">Avg</th>
          <th class="r">SR</th>
          <th class="c">50s</th>
          <th class="c">100s</th>
          <th class="c">4s</th>
          <th class="c">6s</th>
        </tr></thead>
        <tbody>`;
    batting.players.forEach((p, i) => {
      const logo = teamLogoHTML(p.team, 'xs', meta);
      html += `<tr class="${i === 0 ? 'top-row' : ''}">
        <td class="td-rank ${i === 0 ? 'gold' : ''}">${i + 1}</td>
        <td class="td-name">${p.name}</td>
        <td><div class="team-badge">${logo}<span style="color:var(--text-muted);font-size:11px">${p.team}</span></div></td>
        <td class="td-pts r">${p.runs}</td>
        <td class="r">${p.hs}</td>
        <td class="r">${p.avg}</td>
        <td class="r">${p.sr}</td>
        <td class="c">${p['50s']}</td>
        <td class="c">${p['100s']}</td>
        <td class="c">${p['4s']}</td>
        <td class="c">${p['6s']}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;

  } else if (tab === 'bowling' && bowling?.players) {
    html += bannerHtml;
    html += `<div class="table-wrap">
      <table>
        <thead><tr>
          <th style="width:26px">#</th>
          <th>Player</th>
          <th>Team</th>
          <th class="r">Wkts</th>
          <th class="r">Overs</th>
          <th class="r">Runs</th>
          <th class="r">Eco</th>
          <th class="r">Avg</th>
          <th class="r">SR</th>
          <th class="c">Best</th>
          <th class="c">Mdns</th>
        </tr></thead>
        <tbody>`;
    bowling.players.forEach((p, i) => {
      const logo = teamLogoHTML(p.team, 'xs', meta);
      html += `<tr class="${i === 0 ? 'top-row' : ''}">
        <td class="td-rank ${i === 0 ? 'gold' : ''}">${i + 1}</td>
        <td class="td-name">${p.name}</td>
        <td><div class="team-badge">${logo}<span style="color:var(--text-muted);font-size:11px">${p.team}</span></div></td>
        <td class="td-pts r">${p.wkts}</td>
        <td class="r">${p.overs}</td>
        <td class="r">${p.runs}</td>
        <td class="r">${p.eco}</td>
        <td class="r">${p.avg}</td>
        <td class="r">${p.sr}</td>
        <td class="c">${p.best || '—'}</td>
        <td class="c">${p.maidens}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;

  } else if (tab === 'fielding' && fielding?.players) {
    html += bannerHtml;
    html += `<div class="table-wrap">
      <table>
        <thead><tr>
          <th style="width:26px">#</th>
          <th>Player</th>
          <th>Team</th>
          <th class="r">Dismissals</th>
          <th class="r">Catches</th>
          <th class="r">Ct Behind</th>
          <th class="r">Stumpings</th>
          <th class="r">Run Outs</th>
        </tr></thead>
        <tbody>`;
    fielding.players.forEach((p, i) => {
      const logo = teamLogoHTML(p.team, 'xs', meta);
      html += `<tr class="${i === 0 ? 'top-row' : ''}">
        <td class="td-rank ${i === 0 ? 'gold' : ''}">${i + 1}</td>
        <td class="td-name">${p.name}</td>
        <td><div class="team-badge">${logo}<span style="color:var(--text-muted);font-size:11px">${p.team}</span></div></td>
        <td class="td-pts r">${p.dismissals}</td>
        <td class="r">${p.catches}</td>
        <td class="r">${p.caughtBehind}</td>
        <td class="r">${p.stumpings}</td>
        <td class="r">${p.runOuts}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;

  } else if (tab === 'mvp' && mvp?.players) {
    html += bannerHtml;
    html += `<div class="table-wrap">
      <table>
        <thead><tr>
          <th style="width:26px">#</th>
          <th>Player</th>
          <th>Team</th>
          <th>Role</th>
          <th class="r">Batting</th>
          <th class="r">Bowling</th>
          <th class="r">Fielding</th>
          <th class="r">Total</th>
        </tr></thead>
        <tbody>`;
    mvp.players.forEach((p, i) => {
      const logo = teamLogoHTML(p.team, 'xs', meta);
      html += `<tr class="${i === 0 ? 'top-row' : ''}">
        <td class="td-rank ${i === 0 ? 'gold' : ''}">${i + 1}</td>
        <td class="td-name">${p.name}</td>
        <td><div class="team-badge">${logo}<span style="color:var(--text-muted);font-size:11px">${p.team}</span></div></td>
        <td style="color:var(--text-muted);font-size:11px">${p.role}</td>
        <td class="r">${p.batting.toFixed(2)}</td>
        <td class="r">${p.bowling.toFixed(2)}</td>
        <td class="r">${p.fielding.toFixed(3)}</td>
        <td class="td-pts r">${p.total.toFixed(2)}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  } else {
    html += `<p style="color:var(--text-muted);font-size:13px;padding:24px 0">No data available for this category.</p>`;
  }

  html += '</div>';
  el.innerHTML = html;
}
