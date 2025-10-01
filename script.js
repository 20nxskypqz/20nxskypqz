// js-Root-01102025-01 — includes, side menu, dark-mode (manual), root dropdowns

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

  // Dark mode (manual only)
  const modeToggle = document.getElementById('mode-toggle');
  const modeIcon = document.getElementById('mode-icon');
  const saved = localStorage.getItem('theme');
  if(saved === 'dark'){ document.body.classList.add('dark-mode'); }
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

function wireRootDropdowns(){
  const rootToggles = document.querySelectorAll('.root-section-toggle, .icon-btn.root-section-toggle');
  rootToggles.forEach(btn=>{
    const sel = btn.getAttribute('data-target');
    const list = document.querySelector(sel);
    btn.addEventListener('click', ()=>{
      if(!list) return;
      const hidden = list.hasAttribute('hidden');
      if(hidden) list.removeAttribute('hidden'); else list.setAttribute('hidden','');
    });
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await includeFragments();
  wireCommonUI();
  wireRootDropdowns();
});