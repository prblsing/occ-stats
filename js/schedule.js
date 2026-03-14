// ════════════════════════════════════════════════════════
// schedule.js  |  Schedule & Results renderer
// ════════════════════════════════════════════════════════

function renderPage(page, data) {
  if (page !== 'schedule') return;
  const { meta, groups, knockout } = data;
  const el = document.getElementById('schedule-content');
  if (!el) return;

  let html = '<div class="page-content">';

  // ── Knockout ──
  html += `<div class="stage-label">Knockout Stage</div>`;
  if (knockout?.matches?.length) {
    html += `<div class="grid-2">`;
    knockout.matches.slice().reverse().forEach(m => {
      html += renderMatchCard(m, meta);
    });
    html += `</div>`;
  }

  // ── Super Stage ──
  if (groups?.superStage) {
    html += `<div class="stage-label" style="margin-top:24px">${groups.superStage.label}</div>`;
    groups.superStage.groups.forEach(grp => {
      html += `<p class="card-label" style="margin:10px 0 6px;color:var(--text-muted)">${grp.name}</p>`;
      html += renderGroupTable(grp.teams, meta);
    });
  }

  // ── League Groups ──
  if (groups?.league?.length) {
    html += `<div class="stage-label" style="margin-top:24px">League Stage</div>`;
    groups.league.forEach(grp => {
      html += `<p class="card-label" style="margin:10px 0 6px;color:var(--text-muted)">Group ${grp.name}</p>`;
      html += renderGroupTable(grp.teams, meta);
    });
  }

  html += '</div>';
  el.innerHTML = html;
  document.getElementById('schedule-badge').textContent = OCC.year;
}
