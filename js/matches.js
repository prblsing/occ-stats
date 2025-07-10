// js/matches.js

/**
 * Normalize raw match_type into one of our stage groups.
 */
function normalizeStage(rawType) {
  const map = {
    "League Match":   "Group League",
    "Super Six":      "Super Six",
    "Semi Final":     "Semi",
    "Eliminator":     "Eliminator",
    "Third Position": "Eliminator",
    "Final":          "Final"
  };
  return map[rawType] || rawType;
}

/**
 * Map a normalized stage to the CSS class for its color.
 */
function getStageClass(stage) {
  const colors = {
    "Group League": "league",
    "Super Six":    "super6",
    "Semi":         "semi",
    "Eliminator":   "elim",
    "Final":        "final"
  };
  return colors[stage] || "league";
}

async function renderMatches() {
  // 1) Fetch all data
  const matches     = await fetchData('match_summaries.json');
  const players     = await fetchData('players.json');
  const teams       = await fetchData('teams.json');
  const playerStats = await fetchData('individual_player_stats.json');

  const timeline = document.getElementById('timeline');
  const yearSel  = document.getElementById('year-select');
  const stageSel = document.getElementById('stage-filter');
  const selectedStage = stageSel.value;

  // 2) Group by date & apply stage filter
  const byDate = {};
  matches.forEach(m => {
    const stage = normalizeStage(m.match_type);
    if (selectedStage !== 'all' && stage !== selectedStage) return;
    (byDate[m.date] = byDate[m.date] || []).push({ ...m, stage });
  });

  // 3) Sort dates ascending
  const dates = Object.keys(byDate).sort((a, b) => {
    const toDate = str => {
      const [d,mo,y] = str.split('-').map(Number);
      return new Date(2000+y, mo-1, d);
    };
    return toDate(a) - toDate(b);
  });

  // 4) Render each date group
  timeline.innerHTML = '';
  dates.forEach(date => {
    const dateGroup = document.createElement('div');
    dateGroup.innerHTML = `<h3>${date}</h3>`;

    // Sort matches by time
    const sorted = byDate[date].sort((x, y) => {
      const parse = t => {
        const [h,m] = t.split(' ')[0].split(':').map(Number);
        return t.endsWith('PM') && h!==12 ? (h+12)*60+m : (h%12)*60+m;
      };
      return parse(x.time) - parse(y.time);
    });

    // Grid container
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    grid.style.gap = '1rem';

    // Each card
    sorted.forEach(m => {
      const team1  = teams.find(t => t.uuid === m.team1_uuid)?.name || 'Team 1';
      const team2  = teams.find(t => t.uuid === m.team2_uuid)?.name || 'Team 2';
      const winner = teams.find(t => t.uuid === m.winner_uuid)?.name  || 'Unknown';

      const card = document.createElement('div');
      card.className = `timeline-node clickable ${getStageClass(m.stage)}`;
      card.innerHTML = `
        <time>${m.time}</time>
        <h4>${team1} vs ${team2}</h4>
        <p><strong>${winner}</strong> ${m.win_margin}</p>
        <p><em>${m.stage}</em></p>
      `;
      card.onclick = () => showMatchModal(m, players, teams, playerStats);
      grid.appendChild(card);
    });

    dateGroup.appendChild(grid);
    timeline.appendChild(dateGroup);
  });
}

/**
 * Populate and show the Match Details modal.
 */
function showMatchModal(match, players, teams, playerStats) {
  const modal = document.getElementById('match-modal');
  const body  = document.getElementById('match-modal-body');

  // Helpers
  const getTeam   = u => teams.find(t => t.uuid === u) || {};
  const getPlayer = id => players.find(p => p.uuid === id) || { name:'–' };

  // Resolve teams & winner
  const t1 = getTeam(match.team1_uuid);
  const t2 = getTeam(match.team2_uuid);
  const winnerName = getTeam(match.winner_uuid).name || 'Unknown';

  // Awards config
  const awardsConfig = [
    { key:'player_of_match_uuid', label:'Player of the Match' },
    { key:'best_batter_uuid',     label:'Best Batter'        },
    { key:'best_bowler_uuid',     label:'Best Bowler'        },
    { key:'mvp1_uuid',            label:`MVP 1 (${match.mvp1_score})` },
    { key:'mvp2_uuid',            label:`MVP 2 (${match.mvp2_score})` },
    { key:'mvp3_uuid',            label:`MVP 3 (${match.mvp3_score})` }
  ];

  // Bucket awards under each team
  const teamAwards = { [t1.uuid]: [], [t2.uuid]: [] };
  awardsConfig.forEach(a => {
    const pid = match[a.key];
    if (!pid) return;
    const pname = getPlayer(pid).name;
    const stats = playerStats.find(r => r.player_uuid === pid);
    if (!stats) return;
    // find which team they represented
    const side = Object.keys(stats.team_wise_stats)
      .find(u => u === t1.uuid || u === t2.uuid);
    if (side) teamAwards[side].push({ label:a.label, name:pname });
  });

  // Build HTML
  body.innerHTML = `
    <span class="modal-close">&times;</span>

    <!-- HEADER: date/time/loc left, trophy right -->
    <div class="modal-header">
      <div class="mh-left">
        <span class="mh-item">📅 ${match.date}</span>
        <span class="mh-item">⏰ ${match.time}</span>
        <span class="mh-item">📍 ${match.ground}</span>
      </div>
      <div class="mh-right">
        <img src="images/trophy.png" alt="Trophy" class="mh-trophy"/>
      </div>
    </div>

    <!-- TEAMS + AWARDS -->
    <div class="modal-teams-awards">
      <!-- Team 1 -->
      <div class="team-panel">
        <img src="${t1.team_icon}" class="team-logo" alt="${t1.name}"/>
        <h4>${t1.name}</h4>
        <p>${match.team1_runs}/${match.team1_wickets} in ${match.team1_overs} ov</p>
        <div class="team-awards">
          ${teamAwards[t1.uuid].map(a =>
            `<p><strong>${a.label}:</strong> ${a.name}</p>`
          ).join('')}
        </div>
      </div>

      <!-- Team 2 -->
      <div class="team-panel">
        <img src="${t2.team_icon}" class="team-logo" alt="${t2.name}"/>
        <h4>${t2.name}</h4>
        <p>${match.team2_runs}/${match.team2_wickets} in ${match.team2_overs} ov</p>
        <div class="team-awards">
          ${teamAwards[t2.uuid].map(a =>
            `<p><strong>${a.label}:</strong> ${a.name}</p>`
          ).join('')}
        </div>
      </div>
    </div>

    <hr class="modal-separator"/>

    <!-- WINNER CENTERED -->
    <div class="modal-winner">
      <strong>Winner:</strong> ${winnerName} (${match.win_margin})
    </div>

    <!-- REQUEST UPDATE FORM -->
    <button id="request-update-btn" class="btn-primary">Request Update</button>
    <form id="update-form" class="update-form" style="display:none;">
      <textarea id="update-desc" placeholder="Describe your change" rows="3"></textarea>
      <input type="file" id="update-file"/>
      <button type="button" id="submit-update">Submit</button>
    </form>
  `;

  // show & hooks
  modal.style.display = 'flex';
  body.querySelector('.modal-close').onclick = () => modal.style.display = 'none';
  document.getElementById('request-update-btn').onclick = () =>
    document.getElementById('update-form').style.display = 'flex';
  document.getElementById('submit-update').onclick = () => {
    const desc = document.getElementById('update-desc').value.trim();
    const file = document.getElementById('update-file').files[0];
    if (!desc) return alert('Please add a description.');
    // TODO: send to backend
    alert(`Requested change:\n• ${desc}\n• File: ${file?.name||'none'}`);
    modal.style.display = 'none';
  };
}


/**
 * Initialize the page once the DOM is ready.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('timeline')) return;

  const yearSel  = document.getElementById('year-select');
  const stageSel = document.getElementById('stage-filter');

function refresh() {
  const year = yearSel.value;
  document.getElementById('hero-year').textContent = year;
  if (year !== '2024') {
    showComingSoon(year);
  } else {
    document.getElementById('content').style.display = '';
    document.getElementById('coming').style.display = 'none';
    // Call your page’s main render function here, e.g.:
    if (typeof renderMatches === 'function') renderMatches();
    if (typeof renderPlayers === 'function') renderPlayers();
    if (typeof renderTeams === 'function') renderTeams();
    if (typeof renderSummary === 'function') renderSummary();
  }
}

  refresh();
  yearSel.addEventListener('change', refresh);
  stageSel?.addEventListener('change', renderMatches);
});

document.addEventListener('DOMContentLoaded', function() {
  window.yearSel = document.getElementById('year-select');
  yearSel.addEventListener('change', refresh);
  refresh();
});

