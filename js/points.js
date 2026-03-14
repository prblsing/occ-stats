// ════════════════════════════════════════════════════════
// points.js  |  Points Table renderer
// ════════════════════════════════════════════════════════

function renderPage(page, data) {
  if (page !== 'points') return;
  const { meta, groups } = data;
  const el = document.getElementById('points-content');
  if (!el) return;

  let html = '<div class="page-content">';

  // Champion banner
  if (meta?.champion) {
    html += `<div class="champion-banner">
      <span class="champion-trophy">🏆</span>
      <div>
        <strong>${meta.champion}</strong> — ${OCC.year} OCC Champions
        ${meta.runnersUp ? `<span style="color:var(--text-muted)"> · Runners up: ${meta.runnersUp}</span>` : ''}
        ${meta.thirdPlace ? `<span style="color:var(--text-muted)"> · 3rd: ${meta.thirdPlace}</span>` : ''}
      </div>
    </div>`;
  }

  // Super stage
  if (groups?.superStage) {
    html += `<div class="stage-label">${groups.superStage.label}</div>`;
    groups.superStage.groups.forEach(grp => {
      html += `<p class="card-label" style="margin:10px 0 6px;color:var(--text-muted)">${grp.name}</p>`;
      html += renderGroupTable(grp.teams, meta);
    });
  }

  // League groups
  if (groups?.league?.length) {
    html += `<div class="stage-label" style="margin-top:24px">League Stage</div>`;
    groups.league.forEach(grp => {
      html += `<p class="card-label" style="margin:10px 0 6px;color:var(--text-muted)">Group ${grp.name}</p>`;
      html += renderGroupTable(grp.teams, meta);
    });
  }

  html += '</div>';
  el.innerHTML = html;
  document.getElementById('points-badge').textContent = OCC.year;
}
