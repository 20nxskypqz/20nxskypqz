// Root-js-14102025-[LiquidGlass-Fix]

(function () {
  "use strict";

  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const THEME_KEY = 'theme@20nxskypqz';

  function applyTheme(mode) {
    const b = document.body;
    if (mode === 'dark') { b.classList.add('dark-mode'); b.classList.remove('light-mode'); }
    else { b.classList.add('light-mode'); b.classList.remove('dark-mode'); }
  }

  function injectHelpersCSS() {
    if (document.getElementById('root-shared-helpers')) return;
    const style = document.createElement('style');
    style.id = 'root-shared-helpers';
    style.textContent = `
      .root-section-toggle .material-symbols-outlined { color: currentColor !important; }
      .dark-mode .root-section-toggle { color:#fff !important; }
      .light-mode .root-section-toggle { color:inherit; }
      .root-link-card[hidden] { display:none !important; }
    `;
    document.head.appendChild(style);
  }

  async function loadIncludes() {
    let nodesToInclude = qsa('[data-include]');
    while (nodesToInclude.length > 0) {
      for (const node of nodesToInclude) {
        const url = node.getAttribute('data-include');
        node.removeAttribute('data-include');
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) throw new Error(`Failed to fetch ${url}`);
          const html = await res.text();
          const temp = document.createElement('div');
          temp.innerHTML = html.trim();
          const frag = document.createDocumentFragment();
          while (temp.firstChild) { frag.appendChild(temp.firstChild); }
          node.replaceWith(frag);
        } catch (e) { console.error('Include failed:', url, e); node.remove(); }
      }
      nodesToInclude = qsa('[data-include]');
    }
  }

  function initSideMenu(){
    const menuToggle = document.getElementById('menuToggle');
    const slideMenu  = document.getElementById('sideMenu');
    const closeBtn   = document.getElementById('closeMenuBtn');

    if (!menuToggle || !slideMenu || !closeBtn) {
      return;
    }

    const openMenu = () => {
      slideMenu.classList.add('active');
      document.body.classList.add('menu-active');
      slideMenu.setAttribute('aria-hidden', 'false');
    };
    const closeMenu = () => {
      slideMenu.classList.remove('active');
      document.body.classList.remove('menu-active');
      slideMenu.setAttribute('aria-hidden', 'true');
    };

    menuToggle.addEventListener('click', (e) => { e.stopPropagation(); openMenu(); });
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeMenu(); });

    slideMenu.addEventListener('click', (e) => {
      const btn = e.target.closest('.menu-section-toggle');
      if (btn) {
        e.stopPropagation();
        const key = btn.getAttribute('data-menu-tier');
        const tier = document.getElementById('menu-' + key);
        if (!tier) return;
        const willShow = tier.hasAttribute('hidden');
        if (willShow) tier.removeAttribute('hidden'); else tier.setAttribute('hidden', '');
        const caret = btn.querySelector('.material-symbols-outlined');
        if (caret) caret.style.transform = willShow ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });

    document.addEventListener('click', (e) => {
      if (slideMenu.classList.contains('active') && !e.target.closest('#sideMenu')) {
        closeMenu();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && slideMenu.classList.contains('active')) {
        closeMenu();
      }
    });
  }
  
  function initRootDropdowns() {
    const toggles = qsa('.root-section-toggle');
    if (toggles.length === 0) return;
    
    const hideAllRootPanels = () => {
      qsa('.root-link-card').forEach(panel => { panel.hidden = true; });
      toggles.forEach(btn => {
        btn.setAttribute('aria-expanded','false');
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) icon.style.transform = 'rotate(0deg)';
      });
    }
    
    hideAllRootPanels();

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.root-section-toggle');
      if (!btn) {
        if (!e.target.closest('.root-link-card')) hideAllRootPanels();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const sel = btn.getAttribute('data-target');
      const panel = sel ? qs(sel) : null;
      if (!panel) return;
      
      const willOpen = panel.hidden;
      const icon = btn.querySelector('.material-symbols-outlined');

      hideAllRootPanels();

      if (willOpen) {
        panel.hidden = false;
        btn.setAttribute('aria-expanded','true');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  }

  function bindThemeToggle() {
    const toggleCheckbox = qs('#mode-toggle-checkbox');
    if (!toggleCheckbox) return;
    const initial = (localStorage.getItem(THEME_KEY) === 'dark') ? 'dark' : 'light';
    applyTheme(initial);
    toggleCheckbox.checked = (initial === 'dark');
    toggleCheckbox.addEventListener('change', () => {
      const next = toggleCheckbox.checked ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  function initHomeTimeIfPresent() {
    const hostTime = qs('#current-time');
    const hostCd   = qs('#countdown-display');
    if (!hostTime && !hostCd) return;
    if (window.__HOME_TIME_LOOP__) { clearTimeout(window.__HOME_TIME_LOOP__); window.__HOME_TIME_LOOP__ = null; }
    function ensureShadow(host, id){
      if (!host) return null;
      if (!host.shadowRoot) {
        const shadow = host.attachShadow({ mode:'open' });
        shadow.innerHTML = `<style>:host { display:block; width:100%; } .wrap { display:block; text-align:center; font-variant-numeric:tabular-nums; white-space:nowrap; }</style><span class="wrap" id="${id}"></span>`;
      }
      return host.shadowRoot.getElementById(id);
    }
    const timeSpan = ensureShadow(hostTime,'clock');
    const cdSpan   = ensureShadow(hostCd,'cd');
    const TZ = 'Asia/Bangkok';
    const dtf = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
    const formatDateTH24 = (d) => { const p = dtf.formatToParts(d).reduce((o,part)=>(o[part.type]=part.value,o),{}); return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second}`; };
    const buildCountdown = (now) => {
      const target = new Date('2026-01-01T00:00:00+07:00').getTime();
      let diff = Math.max(0, target - now.getTime());
      const days = Math.floor(diff/86400000); diff%=86400000;
      const hours = Math.floor(diff/3600000); diff%=3600000;
      const minutes = Math.floor(diff/60000); diff%=60000;
      const seconds = Math.floor(diff/1000);
      return `${days} Days ${String(hours).padStart(2,'0')} Hours ${String(minutes).padStart(2,'0')} Minutes ${String(seconds).padStart(2,'0')} Seconds`;
    };
    function tickAligned(){
      const now = new Date();
      if (timeSpan) timeSpan.textContent = formatDateTH24(now);
      if (cdSpan)   cdSpan.textContent   = buildCountdown(now);
      const ms = 1000 - now.getMilliseconds();
      window.__HOME_TIME_LOOP__ = setTimeout(tickAligned, ms);
    }
    tickAligned();
  }

  async function boot() {
    await loadIncludes();
    injectHelpersCSS();
    initSideMenu();
    bindThemeToggle();
    initRootDropdowns();
    initHomeTimeIfPresent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
