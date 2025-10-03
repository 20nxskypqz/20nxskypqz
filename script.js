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
    const includeEls = qsa('[data-include]');
    if (includeEls.length === 0) return;
    await Promise.all(includeEls.map(async (el) => {
      const url = el.getAttribute('data-include');
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        const html = await res.text();
        el.outerHTML = html; // NOTE: <script> inside included HTML won’t auto-execute
      } catch (e) { console.error('Include failed:', url, e); }
    }));
  }

  // -------------------------
  // NEW: Basic Slide Menu (works with side-menu.html)
  // -------------------------
  function initSideMenuBasic() {
    if (window.__SIDEMENU_BOUND__) return; // guard from double-binding
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
      setTimeout(()=>{ overlay.hidden = true; }, 200);
      document.body.style.overflow = '';
    }

    forceClosed();

    // Document-level delegation:
    document.addEventListener('click', (e) => {
      const isHamburger = !!e.target.closest('.menu-toggle');
      const isCloseBtn  = !!e.target.closest('.smenu-close');
      const insideDrawer= !!e.target.closest('.smenu');
      const inHeader    = !!e.target.closest('.basic-header');

      if (isHamburger) { e.preventDefault(); openMenu(); return; }
      if (isCloseBtn)  { e.preventDefault(); closeMenu(); return; }

      // click outside drawer (while open) → close
      if (drawer.classList.contains('open') && !insideDrawer && !inHeader) {
        e.preventDefault(); closeMenu(); return;
      }
    });

    // overlay & ESC
    overlay.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });

    // section dropdowns (inside drawer)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.smenu-sec-toggle');
      if (!btn || !drawer.contains(btn)) return;
      const sub = btn.parentElement.querySelector('.smenu-sub');
      if (!sub) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      sub.hidden = expanded;
    });

    window.__SIDEMENU_BOUND__ = true;
  }

  // -------------------------
  // Root page dropdowns
  // -------------------------
  function hideAllRootPanels() {
    qsa('.root-link-card').forEach(panel => { panel.hidden = true; panel.style.display = 'none'; });
    qsa('.root-section-toggle[aria-expanded="true"]').forEach(btn => btn.setAttribute('aria-expanded','false'));
  }
  function initRootDropdowns() {
    hideAllRootPanels();
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.root-section-toggle');
      if (!btn) {
        if (!e.target.closest('.root-link-card')) hideAllRootPanels();
        return;
      }
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
  // Home time & countdown
  // -------------------------
  function initHomeTimeIfPresent() {
    const hostTime = qs('#current-time');
    const hostCd   = qs('#countdown-display');
    if (!hostTime && !hostCd) return;

    if (window.__HOME_TIME_LOOP__) { clearTimeout(window.__HOME_TIME_LOOP__); window.__HOME_TIME_LOOP__ = null; }

    function ensureShadow(host, id){
      if (!host) return null;
      if (!host.shadowRoot) {
        const shadow = host.attachShadow({ mode:'open' });
        const style = document.createElement('style');
        style.textContent = `
          :host { display:block; width:100%; }
          .wrap { display:block; text-align:center; font-variant-numeric:tabular-nums; white-space:nowrap; }
        `;
        const div = document.createElement('span'); div.className='wrap'; div.id=id;
        shadow.append(style, div);
      }
      return host.shadowRoot.getElementById(id);
    }

    const timeSpan = ensureShadow(hostTime,'clock');
    const cdSpan   = ensureShadow(hostCd,'cd');

    const TZ = 'Asia/Bangkok';
    const pad2 = n => n.toString().padStart(2,'0');

    const dtf = new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
    });

    const formatDateTH24 = (d) => {
      const p = dtf.formatToParts(d).reduce((o,part)=>(o[part.type]=part.value,o),{});
      return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second}`;
    };

    const buildCountdown = (now) => {
      const target = new Date('2026-01-01T00:00:00+07:00').getTime();
      let diff = Math.max(0, target - now.getTime());
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