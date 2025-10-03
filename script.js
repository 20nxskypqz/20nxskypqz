/* Root-JS-03102025-[Complete] */
/* js-RootShared-02102025-11
   Add: Basic slide menu wiring for side-menu.html (document-level)
   Keep: HTML includes, theme toggle, root dropdowns, home time & countdown
*/

(function () {
  "use strict";

  // -------------------------
  // Utils
  // -------------------------
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const THEME_KEY = 'theme@20nxskypqz';

  function applyTheme(mode) {
    const b = document.body;
    if (mode === 'dark') { b.classList.add('dark-mode'); b.classList.remove('light-mode'); }
    else { b.classList.add('light-mode'); b.classList.remove('dark-mode'); }
  }
  function setThemeIconAll(mode) {
    const name = (mode === 'dark') ? 'dark_mode' : 'light_mode';
    const modeIcon = qs('#mode-icon'); if (modeIcon) modeIcon.textContent = name;
    qsa('.theme-toggle .material-symbols-outlined').forEach(ic => ic.textContent = name);
  }

  // -------------------------
  // Helper CSS (no slide-menu styling here)
  // -------------------------
  function injectHelpersCSS() {
    if (document.getElementById('root-shared-helpers')) return;
    const style = document.createElement('style');
    style.id = 'root-shared-helpers';
    style.textContent = `
      .root-section-toggle .material-symbols-outlined { color: currentColor !important; }
      .dark-mode .root-section-toggle { color:#fff !important; }
      .light-mode .root-section-toggle { color:inherit; }
      .header .theme-toggle { cursor:pointer; }
      .header .theme-toggle .material-symbols-outlined { vertical-align: middle; }
    `;
    document.head.appendChild(style);
  }

  // -------------------------
  // HTML include (header/footer/side-menu)
  // -------------------------
  async function loadIncludes() {
    const slots = qsa('[data-include]');
    await Promise.all(slots.map(async slot => {
      const url = slot.getAttribute('data-include');
      if (!url) return;
      const res = await fetch(url, { cache: 'no-store' });
      slot.outerHTML = await res.text();
    }));
  }

  // -------------------------
  // Slide menu wiring (side-menu.html)
  // -------------------------
  function initSideMenuBasic(){
    const btn = qs('.menu-toggle');
    const drawer = qs('.smenu');
    const overlay = qs('.smenu-overlay');
    const closeBtn = qs('.smenu-close');

    if (!btn || !drawer || !overlay) return;

    const open = () => {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden','false');
      overlay.hidden = false;
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden','true');
      overlay.classList.remove('show');
      setTimeout(()=> overlay.hidden = true, 200);
      document.body.style.overflow = '';
    };

    btn.addEventListener('click', open);
    overlay.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);

    // sections dropdown inside drawer
    qsa('.smenu-sec-toggle').forEach(tg => {
      tg.addEventListener('click', () => {
        const expanded = tg.getAttribute('aria-expanded') === 'true';
        tg.setAttribute('aria-expanded', String(!expanded));
        const ul = tg.parentElement.querySelector('.smenu-sub');
        if (ul) ul.hidden = expanded;
      });
    });
  }

  // -------------------------
  // Theme toggle (manual only)
  // -------------------------
  function bindThemeToggle(){
    const toggle = qs('#mode-toggle');
    if (!toggle) return;

    let mode = (localStorage.getItem(THEME_KEY) || 'light');
    applyTheme(mode);
    setThemeIconAll(mode);

    const setMode = (m) => {
      mode = m;
      localStorage.setItem(THEME_KEY, mode);
      applyTheme(mode);
      setThemeIconAll(mode);
    };

    toggle.addEventListener('click', ()=>{
      setMode(mode === 'light' ? 'dark' : 'light');
    });
    toggle.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMode(mode === 'light' ? 'dark' : 'light'); }
    });
  }

  // -------------------------
  // Root dropdown cards (show only after click)
  // -------------------------
  function initRootDropdowns(){
    qsa('.root-section-toggle').forEach(btn=>{
      const targetSel = btn.getAttribute('data-target');
      const card = targetSel ? qs(targetSel) : null;
      if (!card) return;
      btn.addEventListener('click', ()=>{
        const isHidden = card.hasAttribute('hidden');
        if (isHidden) card.removeAttribute('hidden'); else card.setAttribute('hidden','');
      });
    });
  }

  // -------------------------
  // Home: time & countdown (only if present on page)
  // -------------------------
  function initHomeTimeIfPresent(){
    const timeSpan = qs('#current-time-th');
    const cdSpan   = qs('#countdown-display');
    if (!timeSpan && !cdSpan) return;

    const pad2 = (n)=> String(n).padStart(2,'0');

    const formatDateTH24 = (d)=>{
      const y = d.getFullYear();
      const mo = d.getMonth()+1;
      const da = d.getDate();
      const hh = pad2(d.getHours());
      const mm = pad2(d.getMinutes());
      const ss = pad2(d.getSeconds());
      return `${da}/${mo}/${y} ${hh}:${mm}:${ss}`;
    };

    const NY = new Date(2026, 0, 1, 0, 0, 0); // Jan 1, 2026
    const buildCountdown = (now)=>{
      let diff = Math.max(0, NY - now);
      const days = Math.floor(diff/86400000); diff%=86400000;
      const hours = Math.floor(diff/3600000); diff%=3600000;
      const minutes = Math.floor(diff/60000); diff%=60000;
      const seconds = Math.floor(diff/1000);
      return `${days} Days ${pad2(hours)} Hours ${pad2(minutes)} Minutes ${pad2(seconds)} Seconds`;
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

  // -------------------------
  // Boot
  // -------------------------
  async function boot() {
    await loadIncludes();        // include header/footer/side-menu first
    injectHelpersCSS();          // helper styles
    initSideMenuBasic();         // drawer
    bindThemeToggle();           // theme
    initRootDropdowns();         // root dropdowns
    initHomeTimeIfPresent();     // time/countdown (if present)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();