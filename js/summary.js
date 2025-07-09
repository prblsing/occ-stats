async function fetchData(file) {
  const res = await fetch(`data/${file}`);
  if (!res.ok) throw new Error(`Failed to fetch ${file}`);
  return res.json();
}

// --- STAT CARDS, proper order ---
async function renderSummaryCards() {
  const stats = await fetchData('summary_stats.json');
  const cards = [
    { title: 'Total Teams', main: stats.total_teams },
    { title: 'Total Players', main: stats.total_players },
    { title: 'Matches', main: stats.total_matches_played },
    { title: 'Runs', main: stats.total_runs_scored },
    { title: 'Wickets', main: stats.total_wickets_taken },
    {
      title: 'Highest Individual Score',
      main: stats.highest_individual_score.score,
      detail: `(${stats.highest_individual_score.player_name})`
    },
    {
      title: 'Best Bowling Figures',
      main: `${stats.best_bowling_figures.figures.wickets}/${stats.best_bowling_figures.figures.runs}`,
      detail: `in ${stats.best_bowling_figures.figures.overs} ov`,
      subtle: `(${stats.best_bowling_figures.player_name})`
    },
    {
      title: 'Highest Team Score',
      main: stats.highest_team_score.score,
      detail: `(${stats.highest_team_score.team_name})`
    }
  ];
  const sc = document.getElementById('summary-cards');
  sc.innerHTML = '';
  cards.forEach(c => {
    sc.innerHTML += `
      <div class="card">
        <div class="card-title">${c.title}</div>
        <span class="stat-main">${c.main}</span>
        ${c.detail ? `<span class="stat-detail">${c.detail}</span>` : ''}
        ${c.subtle ? `<span class="stat-subtle">${c.subtle}</span>` : ''}
      </div>
    `;
  });
}

// --- Bar Chart for Top 5 Run-Scorers ---
async function renderTopRunsChart() {
  const players = await fetchData('individual_player_stats.json');
  // Group by player, sum total_runs for 2024
  const runsArr = [];
  for (const pl of players) {
    const run = pl.overall_stats?.batting?.total_runs || 0;
    runsArr.push({ name: pl.player_name, value: run });
  }
  runsArr.sort((a, b) => b.value - a.value);
  const top = runsArr.slice(0, 5);
  const ctx = document.getElementById('top-runs-chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top.map(x => x.name),
      datasets: [{
        label: 'Runs',
        data: top.map(x => x.value),
        backgroundColor: '#7ba9f2'
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

// --- Bar Chart for Top 5 Wicket-Takers ---
async function renderTopWicketsChart() {
  const players = await fetchData('individual_player_stats.json');
  // Group by player, sum total_wickets for 2024
  const wicketsArr = [];
  for (const pl of players) {
    const wkts = pl.overall_stats?.bowling?.total_wickets || 0;
    wicketsArr.push({ name: pl.player_name, value: wkts });
  }
  wicketsArr.sort((a, b) => b.value - a.value);
  const top = wicketsArr.slice(0, 5);
  const ctx = document.getElementById('top-wickets-chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top.map(x => x.name),
      datasets: [{
        label: 'Wickets',
        data: top.map(x => x.value),
        backgroundColor: '#f27676'
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

function showComingSoon(year) {
  document.getElementById('content').style.display = 'none';
  document.getElementById('coming').style.display = 'block';
  document.getElementById('coming-text').textContent = `${year} Coming Soon`;
}

function hideComingSoon() {
  document.getElementById('content').style.display = 'block';
  document.getElementById('coming').style.display = 'none';
}


// --- PAGE INIT ---
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('footer-year').textContent = new Date().getFullYear();
  const yrSel = document.getElementById('year-select');
  const year = yrSel.value;
  document.getElementById('hero-year').textContent = year;

  if (year !== '2024') {
    showComingSoon(year);
    return;
  } else {
    hideComingSoon();
  }

  await renderSummaryCards();
  await renderTopRunsChart();
  await renderTopWicketsChart();

  yrSel.addEventListener('change', function() { location.reload(); });
});
