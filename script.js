/* js-RootShared-01102025-23
   - HOTFIX: Theme toggle still not clickable → make it bulletproof
     • Global event delegation (click + touchend + keydown[Enter/Space])
     • Match multiple selectors & fallback to icon text ('light_mode'/'dark_mode')
     • Ensure pointer + z-index so it’s tappable even near overlays
   - Keep: ver.20 time (no flicker, centered via Shadow DOM), dropdown icon dark-mode color fix,
           always-black outline icon for theme toggle
*/

(function () {
  "use strict";

  // -------------------------
  // Utilities
  // -------------------------
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const THEME_KEY = 'theme@20nxskypqz';
  const TOGGLE_SELECTORS = [
    '.theme-toggle',
    '[data-theme-toggle]',
    '#theme-toggle',
    '.toggle-theme',
    '[aria-label="Toggle theme"]'
  ];

  function applyTheme(mode) {
    const b = document.body;
    if (mode === 'dark') { b.classList.add('dark-mode'); b.classList.remove('light-mode'); }
    else { b.classList.add('light-mode'); b.classList.remove('dark-mode'); }
  }

  function currentTheme() {
    return document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  }

  function setThemeIconAll(mode) {
    const name = (mode === 'dark') ? 'dark_mode' : 'light_mode'; // moon in dark, sun in light
    qsa('.theme-toggle .material-symbols-outlined, [data-theme-toggle] .material-symbols-outlined, #theme-toggle .material-symbols-outlined, .toggle-theme .material-symbols-outlined').forEach(ic => {
      ic.textContent = name;
    });
  }

  function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    setThemeIconAll(next);
  }

  // Expose for quick debug (optional)
  window.__toggleTheme = toggleTheme;

  // -------------------------
  // Inject CSS helpers
  // -------------------------
  function injectDropdownIconDarkFix() {
    if (document.getElementById('dropdown-dark-fix')) return;
    const style = document.createElement('style');
    style.id = 'dropdown-dark-fix';
    style.textContent = `
      .root-section-toggle .material-symbols-outlined { color: currentColor !important; }
      .dark-mode .root-section-toggle { color: #fff !important; }
      .light-mode .root-section-toggle { color: inherit; }
    `;
    document.head.appendChild(style);
  }

  function injectThemeToggleIconFix() {
    if (document.getElementById('theme-toggle-icon-fix')) return;
    const style = document.createElement('style');
    style.id = 'theme-toggle-icon-fix';
    style.textContent = `
      .header .theme-toggle,
      .header [data-theme-toggle],
      .header #theme-toggle,
      .header .toggle-theme {
        cursor: pointer; pointer-events: auto; position: relative; z-index: 5;
      }
      .header .theme-toggle .material-symbols-outlined,
      .header [data-theme-toggle] .material-symbols-outlined,
      .header #theme-toggle .material-symbols-outlined,
      .header .toggle-theme .material-symbols-outlined {
        color: #000 !important;
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 40;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
  }

  // -------------------------
  // HTML includes (header/footer/side-menu)
  // -------------------------
  async function loadIncludes() {
    const includeEls = qsa('[data-include]');
    await Promise.all(includeEls.map(async (el) => {
      const url = el.getAttribute('data-include');
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        const html = await res.text();
        el.outerHTML = html;
      } catch (e) {
        console.error('Include failed:', url, e);
      }
    }));
  }

  // -------------------------
  // Side menu (hamburger)
  // -------------------------
  function bindSideMenu() {
    const header  = qs('.header');
    const menu    = qs('.side-menu');
    const overlay = qs('.menu-overlay');
    if (!menu || !overlay || !header) return;

    const openBtns = [
      ...qsa('.header .menu-button', header),
      ...qsa('.header [data-open-menu]', header),
      ...qsa('.header .hamburger', header)
    ];
    const iconMenu = qsa('.header .material-symbols-outlined', header)
      .filter(el => (el.textContent || '').trim().toLowerCase() === 'menu');
    openBtns.push(...iconMenu);

    const closeBtn = qs('.side-menu .close-menu');
    const open = () => {
      menu.classList.add('open');
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      menu.classList.remove('open');
      overlay.classList.remove('show');
      document.body.style.overflow = '';
    };

    openBtns.forEach(btn => btn && btn.addEventListener('click', open));
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  // -------------------------
  // Robust Theme Toggle Delegation
  // -------------------------
  function bindThemeToggleDelegation() {
    // Initial apply & icon sync
    const initial = (localStorage.getItem(THEME_KEY) === 'dark') ? 'dark' : 'light';
    applyTheme(initial);
    setThemeIconAll(initial);

    // Helper: find toggle element from any clicked node
    function findToggleEl(start) {
      for (const sel of TOGGLE_SELECTORS) {
        const found = start.closest(sel);
        if (found) return found;
      }
      // fallback: clicking directly on the icon with text light_mode/dark_mode
      const icon = start.closest('.material-symbols-outlined');
      if (icon) {
        const name = (icon.textContent || '').trim().toLowerCase();
        if (name === 'light_mode' || name === 'dark_mode') {
          // if icon is inside header, allow it
          const header = icon.closest('.header');
          if (header) return icon;
        }
      }
      return null;
    }

    // Click handler (capture) — beats other handlers/overlays
    const onClick = (e) => {
      const target = e.target;
      const hit = findToggleEl(target);
      if (!hit) return;
      e.preventDefault();
      // don’t stopPropagation fully; allow others if needed
      toggleTheme();
    };

    // Touch support
    const onTouchEnd = (e) => {
      const target = e.target;
      const hit = findToggleEl(target);
      if (!hit) return;
      e.preventDefault();
      toggleTheme();
    };

    // Keyboard support
    const onKeyDown = (e) => {
      const target = e.target;
      const hit = findToggleEl(target);
      if (!hit) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTheme();
      }
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('touchend', onTouchEnd, true);
    document.addEventListener('keydown', onKeyDown, true);
  }

  // -------------------------
  // Root dropdowns
  // -------------------------
  function initRootDropdowns() {
    qsa('.root-link-card').forEach(panel => {
      panel.hidden = true;
      panel.style.display = 'none';
    });

    qsa('.root-section-toggle').forEach(btn => {
      btn.setAttribute('type', 'button');
      if (!btn.hasAttribute('aria-label')) btn.setAttribute('aria-label', 'Toggle section');
      btn.setAttribute('aria-expanded', 'false');
      btn.style.cursor = 'pointer';

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetSel = btn.getAttribute('data-target');
        if (!targetSel) return;
        const panel = qs(targetSel);
        if (!panel) return;

        const willOpen = panel.hidden === true || panel.style.display === 'none';
        panel.hidden = !willOpen;
        panel.style.display = willOpen ? '' : 'none';
        btn.setAttribute('aria-expanded', String(willOpen));
      });
    });

    document.addEventListener('click', (e) => {
      const withinToggle = e.target.closest('.root-section-toggle');
      const withinPanel  = e.target.closest('.root-link-card');
      if (withinToggle || withinPanel) return;

      qsa('.root-link-card').forEach(panel => {
        panel.hidden = true;
        panel.style.display = 'none';
      });
      qsa('.root-section-toggle[aria-expanded="true"]').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // -------------------------
  // Home: Date & Time (dd/MM/yyyy HH:mm:ss, 2-digit, centered, no flicker) + Countdown
  // -------------------------
  function initHomeTimeIfPresent() {
    const hostTime = qs('#current-time');
    const hostCd   = qs('#countdown-display');
    if (!hostTime && !hostCd) return;

    if (window.__HOME_TIME_LOOP__) { clearTimeout(window.__HOME_TIME_LOOP__); window.__HOME_TIME_LOOP__ = null; }

    function ensureShadow(host, id){
      if (!host) return null;
      if (!host.shadowRoot) {
        const shadow = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `
          :host { display: block; width: 100%; }
          .wrap {
            display: block;
            text-align: center;
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
            white-space: nowrap;
          }
        `;
        const div = document.createElement('span');
        div.className = 'wrap';
        div.id = id;
        shadow.append(style, div);
      }
      return host.shadowRoot.getElementById(id);
    }

    const timeSpan = ensureShadow(hostTime, 'clock');
    const cdSpan   = ensureShadow(hostCd,   'cd');

    const TZ = 'Asia/Bangkok';
    const pad2 = n => n.toString().padStart(2, '0');

    const dtf = new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });

    const formatDateTH24 = (d) => {
      const parts = dtf.formatToParts(d).reduce((o, p) => (o[p.type] = p.value, o), {});
      return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
    };

    const buildCountdown = (now) => {
      const target = new Date('2026-01-01T00:00:00+07:00').getTime();
      let diff = Math.max(0, target - now.getTime());
      const days = Math.floor(diff / 86400000); diff %= 86400000;
      const hours = Math.floor(diff / 3600000);  diff %= 3600000;
      const minutes = Math.floor(diff / 60000);  diff %= 60000;
      const seconds = Math.floor(diff / 1000);
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
    await loadIncludes();
    injectDropdownIconDarkFix();
    injectThemeToggleIconFix();
    bindSideMenu();
    bindThemeToggleDelegation(); // << super robust
    initRootDropdowns();
    initHomeTimeIfPresent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();