// ════════════════════════════════════════════════════════
// teams.js  |  Teams page renderer
// ════════════════════════════════════════════════════════

function renderPage(page, data) {
  if (page !== 'teams') return;
  const { meta, groups } = data;
  const el = document.getElementById('teams-content');
  if (!el) return;

  let html = '<div class="page-content">';

  // Info chips
  html += `<div class="info-chips">
    <div class="info-chip"><strong>${meta?.totalTeams || meta?.teams?.length || '—'}</strong> teams</div>
    <div class="info-chip">Season <strong>${OCC.year}</strong></div>
    <div class="info-chip"><strong>${meta?.venue || 'Siditya Cricket Ground, Noida'}</strong></div>
  </div>`;

  // Team grid
  html += `<div class="grid-teams">`;
  (meta?.teams || []).forEach(name => {
    const color = teamColor(name);
    const logo = teamLogoHTML(name, 'md', meta);
    const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('');

    // Find which group this team is in
    let groupInfo = '';
    groups?.league?.forEach(grp => {
      const found = grp.teams.find(t => t.name === name);
      if (found) groupInfo = `Group ${grp.name} · P${found.pos}`;
    });
    groups?.superStage?.groups?.forEach(grp => {
      const found = grp.teams.find(t => t.name === name);
      if (found) groupInfo += (groupInfo ? ' · ' : '') + `${grp.name} P${found.pos}`;
    });

    html += `<div class="team-card" style="border-left:3px solid ${color}">
      ${logo}
      <div>
        <div class="team-card-name">${name}</div>
        ${groupInfo ? `<div class="team-card-year">${groupInfo}</div>` : ''}
      </div>
    </div>`;
  });
  html += `</div>`;

  html += '</div>';
  el.innerHTML = html;
  document.getElementById('teams-badge').textContent = OCC.year;
}
