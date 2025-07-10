// js/players.js

// --- Helpers for safe value mapping ---
function safe(val, fallback = '-') {
  return (val === undefined || val === null) ? fallback : val;
}
function mapBat(stats) {
  return {
    matches: safe(stats.total_matches ?? stats.matches),
    innings: safe(stats.total_innings ?? stats.innings),
    runs: safe(stats.total_runs ?? stats.runs),
    highest: safe(stats.highest_score ?? stats.highest),
    strike: safe(stats.strike_rate),
    avg: safe(stats.average)
  };
}
function mapBowl(stats) {
  return {
    matches: safe(stats.total_matches ?? stats.matches),
    innings: safe(stats.total_innings ?? stats.innings),
    wkts: safe(stats.total_wickets ?? stats.wickets),
    overs: safe(stats.overs_bowled ?? stats.overs),
    econ: safe(stats.economy_rate),
    avg: safe(stats.average)
  };
}
function mapFld(stats) {
  return {
    matches: safe(stats.total_matches ?? stats.matches),
    catches: safe(stats.total_catches ?? stats.catches),
    stumpings: safe(stats.stumpings),
    dismissals: safe(stats.total_dismissals ?? stats.dismissals)
  };
}

// --- Detect player type for avatar ---
function detectPlayerType(stats) {
  if (!stats || !stats.batting || !stats.bowling || !stats.fielding) return 'default';
  const hasBat  = safe(stats.batting.total_runs, 0) > 0;
  const hasBowl = safe(stats.bowling.total_wickets, 0) > 0;
  const hasSt   = safe(stats.fielding.stumpings, 0) > 0;
  const inns    = safe(stats.batting.total_innings, 1);
  const avgBat  = safe(stats.batting.total_runs, 0) / inns;
  const goodBat = avgBat >= 35;
  const goodBwl = safe(stats.bowling.total_wickets, 0) >= 5;

  if (hasSt && !hasBowl)        return 'keeper';
  if (goodBat && goodBwl)       return 'allrounder';
  if (goodBwl && !goodBat)      return 'bowler';
  if (goodBat && !goodBwl)      return 'batsman';
  if (!hasBat && !hasBowl && safe(stats.fielding.total_dismissals, 0) > 0)
                                 return 'fielder';
  return 'default';
}

// --- Show Player Modal ---
function showPlayerModal(player, record, teamsList, allMatches) {
  const modal   = document.getElementById('player-modal');
  const body    = document.getElementById('modal-body');
  const teamKey = document.getElementById('team-filter').value;

  const allStats  = record.overall_stats  || { batting: {}, bowling: {}, fielding: {} };
  const teamStats = Object.values(record.team_wise_stats || {});

  // pick stats to display (mapped for correct field names!)
  let bat, bowl, fld, breakdown;
  if (teamKey) {
    const sub = teamStats.find(t=>t.team_name===teamKey);
    if (sub) {
      bat       = mapBat(sub.batting || {});
      bowl      = mapBowl(sub.bowling || {});
      fld       = mapFld(sub.fielding || {});
      breakdown = false;
    } else {
      bat       = mapBat(allStats.batting || {});
      bowl      = mapBowl(allStats.bowling || {});
      fld       = mapFld(allStats.fielding || {});
      breakdown = teamStats.length > 1;
    }
  } else {
    bat       = mapBat(allStats.batting || {});
    bowl      = mapBowl(allStats.bowling || {});
    fld       = mapFld(allStats.fielding || {});
    breakdown = teamStats.length > 1;
  }

  // recalc PoMs
  let poms = player.awards.player_of_match || 0;
  if (teamKey && teamsList && allMatches) {
    const teamUuid = teamsList.find(t=>t.name===teamKey)?.uuid;
    if (teamUuid) {
      poms = allMatches.filter(m =>
        m.player_of_match_uuid === player.uuid &&
        (m.team1_uuid===teamUuid || m.team2_uuid===teamUuid)
      ).length;
    }
  }
  const awardsLine = poms
    ? `<p><strong>Awards:</strong> PoM ${poms}</p>`
    : '';

  const type = detectPlayerType(allStats);

  body.innerHTML = `
    <span class="modal-close">&times;</span>
    <img src="images/avatar_${type}.png" class="player-img" alt="${safe(player.name)}"/>
    <div class="modal-section">
      <h2>${safe(player.name)}</h2>
      <p><strong>Teams:</strong> ${Array.isArray(player.teams) ? player.teams.join(', ') : safe(player.teams)}</p>
      <p><strong>Best Score:</strong> ${safe(player.best_score)}</p>
      <p><strong>Best Bowl:</strong> ${
        player.best_bowling_figures
          ? `${safe(player.best_bowling_figures.wickets)}/${safe(player.best_bowling_figures.runs)} (${safe(player.best_bowling_figures.overs)} ov)`
          : '-'
      }</p>
      ${awardsLine}
      <p><strong>Bio:</strong> ${safe(player.bio, 'Not available')}</p>
    </div>
    <div class="modal-section">
      <h3>🏏 Batting${ teamKey ? ` (${teamKey})` : ' (Overall)' }</h3>
      <p>
        Matches: ${bat.matches}, Inns: ${bat.innings}, Runs: ${bat.runs}, HS: ${bat.highest}, SR: ${bat.strike}, Avg: ${bat.avg}
      </p>
      ${ breakdown
         ? teamStats.map(t=>`
             <h4>${safe(t.team_name)} (Batting)</h4>
             <p>Matches: ${safe(t.batting.matches)}, Inns: ${safe(t.batting.innings)}, Runs: ${safe(t.batting.runs)}, HS: ${safe(t.batting.highest)}</p>
           `).join('')
         : ''
      }
    </div>
    <div class="modal-section">
      <h3>🎯 Bowling${ teamKey ? ` (${teamKey})` : ' (Overall)' }</h3>
      <p>
        Matches: ${bowl.matches}, Inns: ${bowl.innings}, Wkts: ${bowl.wkts}, Overs: ${bowl.overs}, Econ: ${bowl.econ}, Avg: ${bowl.avg}
      </p>
      ${ breakdown
         ? teamStats.map(t=>`
             <h4>${safe(t.team_name)} (Bowling)</h4>
             <p>Matches: ${safe(t.bowling.matches)}, Inns: ${safe(t.bowling.innings)}, Wkts: ${safe(t.bowling.wickets)}, Overs: ${safe(t.bowling.overs)}</p>
           `).join('')
         : ''
      }
    </div>
    <div class="modal-section">
      <h3>🧤 Fielding${ teamKey ? ` (${teamKey})` : ' (Overall)' }</h3>
      <p>
        Matches: ${fld.matches}, Catches: ${fld.catches}, Stumpings: ${fld.stumpings}, Dismissals: ${fld.dismissals}
      </p>
      ${ breakdown
         ? teamStats.map(t=>`
             <h4>${safe(t.team_name)} (Fielding)</h4>
             <p>Matches: ${safe(t.fielding.matches)}, Catches: ${safe(t.fielding.catches)}, Stumpings: ${safe(t.fielding.stumpings)}, Dismissals: ${safe(t.fielding.total_dismissals)}</p>
           `).join('')
         : ''
      }
    </div>
    <button id="request-update-btn">Request Update</button>
    <div id="update-form" style="display:none; text-align:center; margin-top:1rem;">
      <textarea id="update-text" rows="4" placeholder="Describe updates..." style="width:90%;"></textarea><br/>
      <input type="file" id="update-file" style="margin:0.75rem auto; display:block;"/><br/>
      <button id="submit-update">Submit</button>
    </div>
  `;

  // show & wire
  modal.style.display = 'flex';
  body.querySelector('.modal-close').onclick = () => modal.style.display = 'none';
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
  body.querySelector('#request-update-btn').onclick = () => {
    const f = body.querySelector('#update-form');
    f.style.display = (f.style.display==='none') ? 'block' : 'none';
  };
  body.querySelector('#submit-update').onclick = () => {
    const desc = encodeURIComponent(body.querySelector('#update-text').value);
    const file = body.querySelector('#update-file').files[0];
    let bodyText = desc;
    if (file) bodyText += encodeURIComponent(`\n\n_Attachment:_ ${file.name}`);
    const title = encodeURIComponent(`Player Data Update: ${player.name}`);
    window.open(
      `https://github.com/prblsing/occ-stats/issues/new?title=${title}&body=${issueBody}`,
      '_blank'
    );
    modal.style.display = 'none';
  };
}

// --- RENDER PLAYERS GRID ---
async function renderPlayers() {
  const roster    = await fetchData('players.json');
  const statsArr  = await fetchData('individual_player_stats.json');
  const teamsList = await fetchData('teams.json');
  const allMatches= await fetchData('match_summaries.json');

  // populate & sort team filter dropdown
  teamsList.sort((a,b)=> a.name.localeCompare(b.name));
  const teamSel = document.getElementById('team-filter');
  if (teamSel.options.length === 1) {
    teamsList.forEach(t=> teamSel.append(new Option(t.name, t.name)));
  }

  const query   = document.getElementById('player-search').value.toLowerCase();
  const sortKey = document.getElementById('player-sort').value;
  const teamKey = teamSel.value;
  const grid    = document.getElementById('players-grid');
  grid.innerHTML = '';

  roster
    .filter(p=> p.name.toLowerCase().includes(query))
    .filter(p=> !teamKey || p.teams.includes(teamKey))
    .sort((a,b)=>{
      if (sortKey==='name')       return a.name.localeCompare(b.name);
      if (sortKey==='best_score') return b.best_score - a.best_score;
      if (sortKey==='pom')        return b.awards.player_of_match - a.awards.player_of_match;
      if (sortKey==='wickets') {
        const aRec = statsArr.find(x=>x.player_uuid===a.uuid) || {};
        const bRec = statsArr.find(x=>x.player_uuid===b.uuid) || {};
        let wA = aRec.overall_stats?.bowling.total_wickets || 0;
        let wB = bRec.overall_stats?.bowling.total_wickets || 0;
        if (teamKey) {
          const subA = Object.values(aRec.team_wise_stats||{})
                             .find(ts=>ts.team_name===teamKey);
          const subB = Object.values(bRec.team_wise_stats||{})
                             .find(ts=>ts.team_name===teamKey);
          if (subA) wA = subA.bowling.wickets;
          if (subB) wB = subB.bowling.wickets;
        }
        return wB - wA;
      }
      return 0;
    })
    .forEach(p=>{
      const rec   = statsArr.find(x=>x.player_uuid===p.uuid) || {};
      const stats = rec.overall_stats  || { batting:{total_runs:0}, bowling:{total_wickets:0}, fielding:{} };
      let runs    = safe(stats.batting.total_runs);
      let wkts    = safe(stats.bowling.total_wickets);
      if (teamKey) {
        const sub = Object.values(rec.team_wise_stats||{})
                          .find(ts=>ts.team_name===teamKey);
        if (sub) {
          runs = safe(sub.batting.runs);
          wkts = safe(sub.bowling.wickets);
        }
      }

      // recalc PoMs for the card
      let poms = p.awards.player_of_match || 0;
      if (teamKey) {
        const teamUuid = teamsList.find(t=>t.name===teamKey)?.uuid;
        if (teamUuid) {
          poms = allMatches.filter(m=>
            m.player_of_match_uuid===p.uuid &&
            (m.team1_uuid===teamUuid||m.team2_uuid===teamUuid)
          ).length;
        }
      }

      const type = detectPlayerType(stats);
      const img  = `images/avatar_${type}.png`;

      const card = document.createElement('div');
      card.className = 'card clickable';
      card.innerHTML = `
        <img src="${img}" class="player-img" alt="${p.name}"/>
        <div class="card-info">
          <h3 style="color: var(--accent)">${p.name}</h3>
          <p><strong>Teams:</strong> ${p.teams.join(', ')||'—'}</p>
          <p><strong>Total Runs:</strong> ${runs}</p>
          <p><strong>Total Wickets:</strong> ${wkts}</p>
          <p><strong>PoMs:</strong> ${poms}</p>
        </div>
      `;
      card.onclick = () => showPlayerModal(p, rec, teamsList, allMatches);
      grid.appendChild(card);
    });
}

// --- Coming Soon logic (in app.js, but repeat here if needed) ---
function showComingSoon(year, extraMsg) {
  const contentDiv = document.getElementById('content');
  const comingDiv = document.getElementById('coming');
  if (contentDiv) contentDiv.style.display = 'none';
  if (comingDiv) {
    comingDiv.style.display = 'flex';
    comingDiv.innerHTML = `
      <img src="images/trophy.png" style="width:72px; margin-bottom:1.5rem;" alt="Trophy"/>
      <div>🚧 ${year} content is coming soon.<br>${extraMsg || 'Please check back later!'}</div>
    `;
  }
}

// --- Initialization and filter event binding ---
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footer-year').textContent = new Date().getFullYear();

  window.yearSel    = document.getElementById('year-select');
  const searchIn    = document.getElementById('player-search');
  const sortSel     = document.getElementById('player-sort');
  const teamSel     = document.getElementById('team-filter');

  function refresh() {
    const year = yearSel.value;
    document.getElementById('hero-year').textContent = year;
    if (year !== '2024') {
      showComingSoon(year);
    } else {
      document.getElementById('content').style.display = '';
      document.getElementById('coming').style.display = 'none';
      renderPlayers();
    }
  }

  yearSel.addEventListener('change', refresh);
  searchIn.addEventListener('input',  refresh);
  sortSel.addEventListener('change',  refresh);
  teamSel.addEventListener('change',  refresh);

  refresh();
});
