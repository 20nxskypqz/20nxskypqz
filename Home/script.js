// js-Home-30092025-01

// Menu
const sideMenu = document.querySelector('.side-menu');
const menuToggleBtn = document.querySelector('.menu-toggle');
const closeMenuBtn = document.querySelector('.close-menu');
const menuOverlay = document.querySelector('.menu-overlay');
const sectionToggles = document.querySelectorAll('.menu-section-toggle');

function openMenu(){ sideMenu.classList.add('open'); menuOverlay.classList.add('visible'); }
function closeMenu(){ sideMenu.classList.remove('open'); menuOverlay.classList.remove('visible'); }
if(menuToggleBtn) menuToggleBtn.addEventListener('click', openMenu);
if(closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
if(menuOverlay) menuOverlay.addEventListener('click', closeMenu);

sectionToggles.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const expanded = btn.getAttribute('aria-expanded')==='true';
    btn.setAttribute('aria-expanded', String(!expanded));
    const ul = btn.nextElementSibling; if(!ul) return;
    if(expanded) ul.setAttribute('hidden',''); else ul.removeAttribute('hidden');
  });
});

// Theme toggle
const modeToggle = document.getElementById('mode-toggle');
const modeIcon = document.getElementById('mode-icon');
if (modeToggle && modeIcon) {
  modeToggle.addEventListener('click', ()=>{
    document.body.classList.toggle('dark-mode');
    modeIcon.textContent = document.body.classList.contains('dark-mode') ? 'dark_mode' : 'light_mode';
  });
}

// Time & countdown (เดิม)
const dateEl = document.getElementById('date-display');
const timeEl = document.getElementById('time-display');
const cdEl = document.getElementById('countdown-display');

function pad(n){ return n.toString().padStart(2,'0'); }
function tick(){
  const now = new Date();
  const yyyy = now.getFullYear(), mm = pad(now.getMonth()+1), dd = pad(now.getDate());
  const hh = pad(now.getHours()), mi = pad(now.getMinutes()), ss = pad(now.getSeconds());
  if(dateEl) dateEl.textContent = `${dd}/${mm}/${yyyy}`;
  if(timeEl) timeEl.textContent = `${hh}:${mi}:${ss}`;
  const target = new Date('2026-01-01T00:00:00+07:00').getTime();
  const diff = Math.max(0, target - now.getTime());
  const d = Math.floor(diff/86400000);
  const h = Math.floor((diff%86400000)/3600000);
  const m = Math.floor((diff%3600000)/60000);
  const s = Math.floor((diff%60000)/1000);
  if(cdEl) cdEl.textContent = `${d} days ${h} hours ${m} minutes ${s} seconds`;
}
tick(); setInterval(tick, 1000);