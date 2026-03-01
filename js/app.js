// js/app.js

// Simple JSON cache + fetch helper
const cache = {};
async function fetchData(file) {
  if (!cache[file]) {
    const res = await fetch(`data/${file}`);
    if (!res.ok) throw new Error(`Failed to load ${file}`);
    cache[file] = await res.json();
  }
  return cache[file];
}

// Nav-highlight logic on every page
document.addEventListener('DOMContentLoaded', () => {
  const file = window.location.pathname.split('/').pop();
  const page = (!file || file === 'index.html')
    ? 'summary'
    : file.replace('.html','');

  document.querySelectorAll('.nav-item').forEach(a => {
    if (a.dataset.page === page) a.classList.add('active');
  });
});

// coming soon
function showComingSoon(year, extraMsg) {
  const contentDiv = document.getElementById('content');
  const comingDiv = document.getElementById('coming');
  if (contentDiv) contentDiv.style.display = 'none';
  if (comingDiv) {
    comingDiv.style.display = 'flex';
    comingDiv.innerHTML = `
      <img src="images/trophy.svg" style="width:150px; margin-bottom:1.5rem;" alt="Trophy"/>
      <div>🚧 ${year} championship is coming soon.<br>${extraMsg || 'Please check back later!'}</div>
    `;
  }
}

// --- UI: mobile menu toggle (safe to keep with existing code) ---
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('[data-menu-btn]');
  const drawer = document.querySelector('[data-drawer]');

  if (!btn || !drawer) return;

  btn.addEventListener('click', () => {
    drawer.classList.toggle('open');
    const expanded = drawer.classList.contains('open');
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });
});
