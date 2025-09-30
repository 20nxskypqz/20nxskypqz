// js-Root-30092025-14 — Global shared logic (Material Symbols Rounded only)

async function includeFragments(){
  const incs = document.querySelectorAll('[data-include]');
  for (const el of incs){
    const url = el.getAttribute('data-include');
    const res = await fetch(url, { cache: 'no-cache' });
    el.innerHTML = await res.text();
  }
}

function wireCommonUI(){
  const sideMenu = document.querySelector('.side-menu');
  const menuToggleBtn = document.querySelector('.menu-toggle');
  const closeMenuBtn = document.querySelector('.close-menu');
  const menuOverlay = document.querySelector('.menu-overlay');
  const sectionToggles = document.querySelectorAll('.menu-section-toggle');

  const openMenu = ()=>{ sideMenu?.classList.add('open'); menuOverlay?.classList.add('visible'); };
  const closeMenu = ()=>{ sideMenu?.classList.remove('open'); menuOverlay?.classList.remove('visible'); };
  menuToggleBtn?.addEventListener('click', openMenu);
  closeMenuBtn?.addEventListener('click', closeMenu);
  menuOverlay?.addEventListener('click', closeMenu);

  sectionToggles.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const expanded = btn.getAttribute('aria-expanded')==='true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const ul = btn.nextElementSibling;
      if(!ul) return;
      if(expanded) ul.setAttribute('hidden',''); else ul.removeAttribute('hidden');
    });
  });

  // Day/Night toggle — Material Symbols Rounded (light_mode / dark_mode)
  const modeToggle = document.getElementById('mode-toggle');
  const modeIcon = document.getElementById('mode-icon');

  // Default: dark 18:00–05:59 if not set
  const saved = localStorage.getItem('theme');
  if(!saved){
    const h = new Date().getHours();
    const darkNow = (h >= 18 || h < 6);
    if(darkNow) document.body.classList.add('dark-mode');
  } else if(saved === 'dark'){
    document.body.classList.add('dark-mode');
  }

  const refreshIcon = ()=>{
    const isDark = document.body.classList.contains('dark-mode');
    if(modeIcon){ modeIcon.textContent = isDark ? 'dark_mode' : 'light_mode'; }
  };
  refreshIcon();

  modeToggle?.addEventListener('click', ()=>{
    document.body.classList.toggle('dark-mode');
    const dark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    refreshIcon();
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await includeFragments();
  wireCommonUI();

  // Root page: simple dropdown cards
  const rootToggles = document.querySelectorAll('.root-section-toggle');
  rootToggles.forEach(btn=>{
    const sel = btn.getAttribute('data-target');
    const card = document.querySelector(sel);
    btn.addEventListener('click', ()=>{
      if(!card) return;
      const hidden = card.hasAttribute('hidden');
      if(hidden) card.removeAttribute('hidden'); else card.setAttribute('hidden','');
    });
  });
});