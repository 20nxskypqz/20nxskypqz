/* Root-js-03102025-[Complete] */
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
      .header .theme-toggle .material-symbols-outlined,
      #mode-toggle .material-symbols-outlined {
        color:#000 !important;
        font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 40;
        user-select:none;
      }
      .root-link-card[hidden] { display:none !important; }
    `;
    document.head.appendChild(style);
  }

  // -------------------------
  // HTML includes (header/footer/side-menu)
  // -------------------------
  async function loadIncludes() {
    const incs = qsa('[data-include]');
    await Promise.all(incs.map(async host => {
      const url = host.getAttribute('data-include');
      if (!url) return;
      try {
        const res = await fetch(url, { cache:'no-store' });
        const html = await res.text();
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        const frag = tpl.content.cloneNode(true);
        host.replaceWith(frag);
      } catch (e) {
        console.error('include failed:', url, e);
      }
    }));
  }

  // -------------------------
  // Basic side menu wiring (side-menu.html owns its own CSS)
  // -------------------------
  function initSideMenuBasic(){
    const overlay = qs('.smenu-overlay');
    const drawer  = qs('.smenu');

    // if page has no side-menu included, do nothing
    if (!overlay || !drawer) return;

    // initial: force closed
    function forceClosed(){
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden','true');
      overlay.classList.remove('show');
      overlay.hidden = true;
      document.body.style.overflow = '';
      // hide all submenu lists by default
      qsa('.smenu-sub', drawer).forEach(ul => ul.hidden = true);
      qsa('.smenu-sec-toggle', drawer).forEach(btn => btn.setAttribute('aria-expanded','false'));
    }
    function openMenu(){
      drawer.setAttribute('aria-hidden','false');
      drawer.classList.add('open');
      overlay.hidden = false;
      // force paint for transition
      void overlay.offsetHeight;
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu(){
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden','true');
      overlay.classList.remove('show');
      overlay.addEventListener('transitionend', () => { overlay.hidden = true; }, { once:true });
      document.body.style.overflow = '';
    }

    forceClosed();

    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('.menu-toggle')) { e.preventDefault(); openMenu(); return; }
      if (t.closest('.smenu .close-menu')) { e.preventDefault(); closeMenu(); return; }
      if (t === overlay) { e.preventDefault(); closeMenu(); return; }

      const secBtn = t.closest('.smenu-sec-toggle');
      if (secBtn) {
        e.preventDefault();
        const target = qs(secBtn.getAttribute('data-target'), drawer);
        if (!target) return;
        const open = target.hidden !== false ? true : target.style.display === 'none';
        // close others
        qsa('.smenu-sub', drawer).forEach(ul => { ul.hidden = true; ul.style.display=''; });
        qsa('.smenu-sec-toggle', drawer).forEach(btn => btn.setAttribute('aria-expanded','false'));
        // toggle
        if (open) { target.hidden = false; secBtn.setAttribute('aria-expanded','true'); }
        else { target.hidden = true; secBtn.setAttribute('aria-expanded','false'); }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) { closeMenu(); }
    });
  }

  // -------------------------
  // Root page dropdowns (About/Study/Work/Games/Entertainment)
  // -------------------------
  function initRootDropdowns(){
    function hideAllRootPanels(){
      qsa('.root-link-card').forEach(c => { c.hidden = true; c.style.display = 'none'; });
      qsa('.root-section-toggle').forEach(btn => btn.setAttribute('aria-expanded','false'));
    }
    hideAllRootPanels();

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.root-section-toggle');
      if (!btn) return;
      e.preventDefault(); e.stopPropagation();
      const sel = btn.getAttribute('data-target');
      const panel = sel ? qs(sel) : null;
      if (!panel) return;
      const willOpen = panel.hidden || panel.style.display === 'none';
      hideAllRootPanels();
      if (willOpen) { panel.hidden = false; panel.style.display = ''; btn.setAttribute('aria-expanded','true'); }
    });
  }

  // -------------------------
  // Theme toggle
  // -------------------------
  function bindThemeToggle() {
    const initial = (localStorage.getItem(THEME_KEY) === 'dark') ? 'dark' : 'light';
    applyTheme(initial); setThemeIconAll(initial);

    const isToggle = (el) => !!(el.closest('.theme-toggle') || el.closest('#mode-toggle') || el.closest('[data-theme-toggle]'));

    document.addEventListener('click', (e) => {
      if (!isToggle(e.target)) return;
      e.preventDefault();
      const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(next); localStorage.setItem(THEME_KEY, next); setThemeIconAll(next);
    });

    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && isToggle(e.target)) {
        e.preventDefault();
        const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(next); localStorage.setItem(THEME_KEY, next); setThemeIconAll(next);
      }
    });
  }

  // -------------------------
  // Home time + countdown (if present)
  // -------------------------
  function initHomeTimeIfPresent(){
    const timeSpan = qs('#current-time');
    const cdSpan   = qs('#countdown-display');
    if (!timeSpan && !cdSpan) return;

    const TZ = 'Asia/Bangkok';
    const pad2 = (n)=> String(n).padStart(2,'0');
    function formatDateTH24(d){
      // dd/MM/yyyy HH:mm:ss — ไม่มี comma
      const dd = new Intl.DateTimeFormat('en-GB',{day:'2-digit', timeZone:TZ}).format(d);
      const mm = new Intl.DateTimeFormat('en-GB',{month:'2-digit', timeZone:TZ}).format(d);
      const yy = new Intl.DateTimeFormat('en-GB',{year:'numeric', timeZone:TZ}).format(d);
      const hh = new Intl.DateTimeFormat('en-GB',{hour:'2-digit', hour12:false, timeZone:TZ}).format(d);
      const mi = new Intl.DateTimeFormat('en-GB',{minute:'2-digit', timeZone:TZ}).format(d);
      const ss = new Intl.DateTimeFormat('en-GB',{second:'2-digit', timeZone:TZ}).format(d);
      return `${dd}/${mm}/${yy} ${hh}:${mi}:${ss}`;
    }
    function buildCountdown(now){
      const target = new Date('2026-01-01T00:00:00+07:00').getTime();
      let diff = Math.max(0, target - now.getTime());
      const days = Math.floor(diff / 86400000); diff %= 86400000;
      const hours = Math.floor(diff / 3600000); diff %= 3600000;
      const minutes = Math.floor(diff / 60000); diff %= 60000;
      const seconds = Math.floor(diff / 1000);
      return `${days} Days ${pad2(hours)} Hours ${pad2(minutes)} Minutes ${pad2(seconds)} Seconds`;
    }
    // exact tick at next second
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
    initSideMenuBasic();         // << NEW: wire slide menu after includes
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