/* ================================================================
   OCC — Shared page chrome (header + footer injection)
   Call injectChrome() at top of each page script
   ================================================================ */

function buildHeader(seasons, currentYear) {
  const yearPills = seasons.map(s =>
    `<button class="year-pill ${s.year === currentYear ? 'active' : ''}" data-year="${s.year}">${s.year}</button>`
  ).join('');

  return `
  <header class="site-header">
    <div class="header-inner">
      <a class="logo" href="index.html">
        <div class="logo-icon">🏏</div>
        <div class="logo-name">OCC <span>Cricket</span></div>
      </a>

      <nav class="main-nav" id="main-nav">
        <a class="nav-link" href="index.html">Home</a>
        <a class="nav-link" href="points-table.html">Points Table</a>
        <a class="nav-link" href="matches.html">Matches</a>
        <a class="nav-link" href="players.html">Players</a>
        <a class="nav-link" href="teams.html">Teams</a>

        <div class="year-pill-group" id="header-year-pills">
          ${yearPills}
        </div>
      </nav>

      <button class="nav-toggle" id="nav-toggle" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>`;
}

function buildFooter() {
  return `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-logo">OCC <span>Cricket</span></div>
      <div class="footer-links">
        <a href="index.html">Home</a>
        <a href="points-table.html">Points Table</a>
        <a href="matches.html">Matches</a>
        <a href="players.html">Players</a>
        <a href="teams.html">Teams</a>
      </div>
      <div class="footer-copy">© 2026 Offside Cricket Club · All stats updated weekly · Data in <code>data/YEAR/season.json</code></div>
    </div>
  </footer>`;
}

async function injectChrome(opts = {}) {
  // Wait for OCC engine
  const currentYear = await OCC.init(opts.defaultYear || null);
  const seasons = OCC.getSeasons();

  // Inject header
  document.body.insertAdjacentHTML('afterbegin', buildHeader(seasons, currentYear));
  // Inject footer
  document.body.insertAdjacentHTML('beforeend', buildFooter());

  // Wire up header year pills
  document.querySelectorAll('#header-year-pills .year-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#header-year-pills .year-pill').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page-year-btn').forEach(b => {
        b.classList.toggle('active', +b.dataset.year === +btn.dataset.year);
      });
      btn.classList.add('active');
      OCC.setYear(+btn.dataset.year);
    });
  });

  // Wire up mobile toggle
  const toggle = document.getElementById('nav-toggle');
  const nav    = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('.nav-link').forEach(a => {
      a.addEventListener('click', () => { toggle.classList.remove('open'); nav.classList.remove('open'); });
    });
  }

  // Active nav link
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  return currentYear;
}

// ── Page-level year bar builder ──
function buildYearBar(seasons, currentYear, onChange) {
  const container = document.createElement('div');
  container.className = 'year-bar';
  container.innerHTML = `
    <label>Season</label>
    ${seasons.map(s => `<button class="year-btn page-year-btn ${s.year === currentYear ? 'active' : ''}" data-year="${s.year}">${s.year}</button>`).join('')}
  `;
  container.querySelectorAll('.year-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#header-year-pills .year-pill').forEach(b => {
        b.classList.toggle('active', +b.dataset.year === +btn.dataset.year);
      });
      btn.classList.add('active');
      OCC.setYear(+btn.dataset.year);
      onChange(+btn.dataset.year, OCC.getData());
    });
  });
  return container;
}
