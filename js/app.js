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

// App shell behaviors
document.addEventListener('DOMContentLoaded', () => {
  // Nav highlight
  const file = window.location.pathname.split('/').pop();
  const page = (!file || file === 'index.html')
    ? 'summary'
    : file.replace('.html','');

  document.querySelectorAll('.nav-item').forEach(a => {
    if (a.dataset.page === page) a.classList.add('active');
  });

  // Mobile menu toggle
  const btn = document.querySelector('[data-menu-btn]');
  const drawer = document.querySelector('[data-drawer]');
  if (btn && drawer) {
    btn.addEventListener('click', () => {
      drawer.classList.toggle('open');
      const expanded = drawer.classList.contains('open');
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }
});
