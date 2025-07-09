// js/teams.js
// depends on fetchData() from js/app.js

async function renderTeams() {
  const teams   = await fetchData('teams.json');
  const players = await fetchData('players.json');
  const matches = await fetchData('match_summaries.json');
  const grid    = document.getElementById('teams-grid');
  grid.innerHTML = '';

  // Build stats lookup for each team (by UUID)
  const teamStats = {};
  teams.forEach(t => teamStats[t.uuid] = {
    runsScored: 0, ballsFaced: 0,
    runsConceded: 0, ballsBowled: 0,
    matches: 0, wins: 0,
    highest: 0, lowest: 10000
  });

  // Aggregate stats per match
  matches.forEach(match => {
    let t1 = teamStats[match.team1_uuid];
    let t2 = teamStats[match.team2_uuid];
    if (!t1 || !t2) return;

    // Team 1 batting
    t1.runsScored += match.team1_runs;
    t1.ballsFaced += Math.round(parseFloat(match.team1_overs || 0) * 6);
    t1.matches += 1;
    t1.highest = Math.max(t1.highest, match.team1_runs);
    t1.lowest = Math.min(t1.lowest, match.team1_runs);
    if (match.winner_uuid === match.team1_uuid) t1.wins += 1;

    // Team 1 bowling
    t1.runsConceded += match.team2_runs;
    t1.ballsBowled  += Math.round(parseFloat(match.team2_overs || 0) * 6);

    // Team 2 batting
    t2.runsScored += match.team2_runs;
    t2.ballsFaced += Math.round(parseFloat(match.team2_overs || 0) * 6);
    t2.matches += 1;
    t2.highest = Math.max(t2.highest, match.team2_runs);
    t2.lowest = Math.min(t2.lowest, match.team2_runs);
    if (match.winner_uuid === match.team2_uuid) t2.wins += 1;

    // Team 2 bowling
    t2.runsConceded += match.team1_runs;
    t2.ballsBowled  += Math.round(parseFloat(match.team1_overs || 0) * 6);
  });

  // Compute derived stats for each team
  teams.forEach(team => {
    const stat = teamStats[team.uuid];
    // NRPB calculation (Net Runs Per Ball)
    let rating = 0;
    if (stat.ballsFaced && stat.ballsBowled)
      rating = (stat.runsScored / stat.ballsFaced) - (stat.runsConceded / stat.ballsBowled);
    // Win%
    let winPct = stat.matches ? (stat.wins / stat.matches * 100) : 0;
    if (stat.lowest === 10000) stat.lowest = 0;

    team._rating = rating;
    team._winPct = winPct;
    team._highest = stat.highest;
    team._lowest = stat.lowest;
  });

  // Scale NRPB rating to 0–100
  const min = Math.min(...teams.map(t => t._rating));
  const max = Math.max(...teams.map(t => t._rating));
  teams.forEach(team => {
    if (max === min) {
      team._rating_scaled = 100;
    } else {
      team._rating_scaled = 100 * (team._rating - min) / (max - min);
    }
  });

  // Sort by scaled rating descending
  teams.sort((a, b) => b._rating_scaled - a._rating_scaled);

  // Render cards
  teams.forEach(team => {
    const card = document.createElement('div');
    card.className = 'card clickable';
    card.innerHTML = `
      <img src="${team.team_icon}" class="team-icon" alt="${team.name} icon"/>
      <div class="card-info">
        <p><strong>Rating:</strong> ${team._rating_scaled.toFixed(0)}</p>
        <p><strong>Win%:</strong> ${team._winPct.toFixed(0)}%</p>
        <p><strong>Highest:</strong> ${team._highest}</p>
        <p><strong>Lowest:</strong> ${team._lowest}</p>
      </div>
    `;
    card.onclick = () => showTeamModal(team, players);
    grid.appendChild(card);
  });
}

function showTeamModal(team, players) {
  // static close button is already in teams.html
  const modal       = document.getElementById('team-modal');
  const modalContent= modal.querySelector('.modal-content');
  const bodyDiv     = document.getElementById('modal-body');

  // captain name lookup
  const captain = players.find(p => p.uuid === team.captain_uuid)?.name || '—';

  // list all players whose p.teams includes this team.name
  const members = players
    .filter(p => p.teams.includes(team.name))
    .map(p => p.name);

  // fill only the BODY (we do NOT re-insert the <span class="close">)
  bodyDiv.innerHTML = `
    <div class="modal-team-content">
      <img src="${team.team_icon}" class="team-icon-large" alt="${team.name} icon"/>
      <div class="team-details">
        <h2>${team.name}</h2>
        <p><strong>Captain:</strong>        ${captain}</p>
        <p><strong>Matches:</strong>        ${team.total_matches}</p>
        <p><strong>Wins:</strong>           ${team.total_wins}</p>
        <p><strong>Runs Scored:</strong>    ${team.total_runs_scored}</p>
        <p><strong>Runs Conceded:</strong>  ${team.total_runs_conceded}</p>
        <p><strong>Highest Total:</strong>  ${team.highest_total}</p>
        <p><strong>Win Margin:</strong>     ${team.greatest_win_margin}</p>
        <p><strong>Wickets Taken:</strong>  ${team.total_wickets_taken}</p>
        <p><strong>Wickets Given:</strong>  ${team.total_wickets_given}</p>
      </div>
    </div>

    <div class="team-members">
      <strong>Members:</strong> ${members.join(', ')}
    </div>

    <button class="modal-button" id="team-request-update-btn">
      Request Update
    </button>

    <div id="team-update-form" style="display:none;">
      <textarea id="team-update-text" placeholder="Describe updates..."></textarea><br/>
      <input type="file" id="team-update-file"/><br/>
      <button class="modal-button" id="team-submit-update">Submit</button>
    </div>
  `;

  // show it
  modal.style.display = 'flex';

  // wire up the one close button (from static HTML)
  modalContent.querySelector('.close').onclick = () => modal.style.display = 'none';

  // clicking outside
  window.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // toggle update form
  bodyDiv.querySelector('#team-request-update-btn').onclick = () => {
    const f = bodyDiv.querySelector('#team-update-form');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
  };

  // submit → open GitHub issue
  bodyDiv.querySelector('#team-submit-update').onclick = () => {
    const descField = bodyDiv.querySelector('#team-update-text');
    const fileInput = bodyDiv.querySelector('#team-update-file');
    let issueBody = encodeURIComponent(descField.value || '');

    if (fileInput.files.length) {
      issueBody += encodeURIComponent(`\n\n_Attachment:_ ${fileInput.files[0].name}`);
    }

    const title = encodeURIComponent(`Team Data Update: ${team.name}`);
    window.open(
      `https://github.com/YOUR_ORG/YOUR_REPO/issues/new?title=${title}&body=${issueBody}`,
      '_blank'
    );
    modal.style.display = 'none';
  };
}

function refresh() {
  const year = yearSel.value;
  document.getElementById('hero-year').textContent = year;
  if (year !== '2024') {
    showComingSoon(year);
  } else {
    document.getElementById('content').style.display = '';
    document.getElementById('coming').style.display = 'none';
    renderTeams();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  window.yearSel = document.getElementById('year-select');
  yearSel.addEventListener('change', refresh);
  refresh();
});

