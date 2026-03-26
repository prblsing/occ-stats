// ════════════════════════════════════════════════════════
// schedule.js  |  Schedule & Results renderer
// Handles two data shapes:
//   • 2026+   → data.schedule.weeks  (fixture list from Excel)
//   • 2024/25 → data.groups + data.knockout (results)
// ════════════════════════════════════════════════════════

function renderPage(page, data) {
  if (page !== 'schedule') return;
  const el = document.getElementById('schedule-content');
  if (!el) return;

  // Decide which shape we have
  const hasFixtures = data.schedule && data.schedule.weeks && data.schedule.weeks.length;
  const hasResults  = data.knockout && data.knockout.matches && data.knockout.matches.length;

  let html = '<div class="page-content">';

  if (hasFixtures) {
    html += renderFixtureSchedule(data.schedule, data.meta);
  }

  if (hasResults) {
    html += renderResultsSchedule(data, data.meta);
  }

  if (!hasFixtures && !hasResults) {
    html += '<p style="color:var(--text-muted);font-size:13px;padding:32px 0">No schedule data available for this season.</p>';
  }

  html += '</div>';
  el.innerHTML = html;
  document.getElementById('schedule-badge').textContent = OCC.year;
}

// ── FIXTURE SCHEDULE (2026 style) ─────────────────────────────
function renderFixtureSchedule(schedule, meta) {
  const typeColors = {
    'Practice': { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.25)', text: '#6366f1' },
    'League':   { bg: 'rgba(232,130,12,0.08)', border: 'rgba(232,130,12,0.25)', text: '#e8820c' },
    'Final':    { bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.25)',  text: '#dc2626' },
  };

  let html = '';

  schedule.weeks.forEach(function(week) {
    const tc = typeColors[week.type] || typeColors['League'];

    // Week header
    html += '<div style="display:flex;align-items:center;gap:10px;margin:22px 0 10px">' +
      '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:2px;color:var(--text-primary)">' + week.label + '</div>' +
      '<span style="font-size:10px;padding:2px 8px;border-radius:4px;font-family:\'DM Mono\',monospace;letter-spacing:.5px;background:' + tc.bg + ';border:1px solid ' + tc.border + ';color:' + tc.text + '">' + week.type + '</span>' +
      '</div>';

    // Group matches by date
    const byDate = {};
    week.matches.forEach(function(m) {
      const dateKey = m.dateSlot.split(' - ')[0].trim();
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(m);
    });

    Object.keys(byDate).forEach(function(dateKey) {
      const dayMatches = byDate[dateKey];

      // Date sub-header
      html += '<div style="font-size:11px;color:var(--text-muted);font-weight:500;margin:8px 0 6px;padding-left:2px">' + dateKey + '</div>';

      html += '<div class="table-wrap" style="margin-bottom:8px"><table>';
      html += '<thead><tr>' +
        '<th style="width:28px">#</th>' +
        '<th>Time</th>' +
        '<th>Ground</th>' +
        '<th>Team 1</th>' +
        '<th style="text-align:center;width:28px">vs</th>' +
        '<th>Team 2</th>' +
        '</tr></thead><tbody>';

      dayMatches.forEach(function(m) {
        const time = m.dateSlot.split(' - ')[1] || '';
        const logo1 = teamLogoHTML(m.team1, 'xs', meta);
        const logo2 = teamLogoHTML(m.team2, 'xs', meta);
        const isFinal = week.type === 'Final';

        html += '<tr' + (isFinal ? ' style="background:rgba(220,38,38,0.04)"' : '') + '>' +
          '<td style="color:var(--text-muted);font-family:\'DM Mono\',monospace;font-size:11px">' + m.num + '</td>' +
          '<td style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--text-secondary);white-space:nowrap">' + time + '</td>' +
          '<td style="font-size:11px;color:var(--text-muted);white-space:nowrap">' + m.ground + '</td>' +
          '<td class="td-name"><div class="team-badge">' + logo1 + '<span>' + m.team1 + '</span></div></td>' +
          '<td style="text-align:center;color:var(--text-muted);font-size:11px">vs</td>' +
          '<td><div class="team-badge">' + logo2 + '<span style="font-size:12px;color:var(--text-secondary)">' + m.team2 + '</span></div></td>' +
          '</tr>';
      });

      html += '</tbody></table></div>';
    });
  });

  return html;
}

// ── RESULTS SCHEDULE (2024/25 style) ─────────────────────────
function renderResultsSchedule(data, meta) {
  let html = '';

  // Knockout results
  html += '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:2px;color:#e8820c;margin:22px 0 10px">Knockout Stage</div>';
  html += '<div class="grid-2">';
  data.knockout.matches.slice().reverse().forEach(function(m) {
    html += renderMatchCard(m, meta);
  });
  html += '</div>';

  // Super stage
  if (data.groups && data.groups.superStage) {
    html += '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:2px;color:#e8820c;margin:24px 0 10px">' + data.groups.superStage.label + '</div>';
    data.groups.superStage.groups.forEach(function(grp) {
      html += '<p class="card-label" style="margin:10px 0 6px;color:var(--text-muted)">' + grp.name + '</p>';
      html += renderGroupTable(grp.teams, meta);
    });
  }

  // League groups
  if (data.groups && data.groups.league && data.groups.league.length) {
    html += '<div style="font-family:\'Bebas Neue\',sans-serif;font-size:13px;letter-spacing:2px;color:#e8820c;margin:24px 0 10px">League Stage</div>';
    data.groups.league.forEach(function(grp) {
      html += '<p class="card-label" style="margin:10px 0 6px;color:var(--text-muted)">Group ' + grp.name + '</p>';
      html += renderGroupTable(grp.teams, meta);
    });
  }

  return html;
}
