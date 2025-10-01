/* js-RootShared-01102025-25
   - Theme toggle uses your FLATICON sun/moon (like before), WITH color
     • Works in 3 ways (auto-detect, no HTML changes needed):
       (A) If the toggle contains <i data-role="sun"> and <i data-role="moon"> → we show/hide them.
       (B) Else if an <i> has data-day-class / data-night-class → we swap its className.
       (C) Else fallback to Material Symbols text 'light_mode' / 'dark_mode'.
     • Colors: Sun = amber/gold, Moon = black (as you asked).
   - Keeps: ver.20 time (no flicker, centered via Shadow DOM), dropdown icon dark-mode color fix,
            robust event delegation for the toggle (click/touch/keyboard)
*/

(function () {
  "use strict";

  // -------------------------
  // Utilities
  // -------------------------
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const THEME_KEY = 'theme@20nxskypqz';

  function applyTheme(mode) {
    const b = document.body;
    if (mode === 'dark') { b.classList.add('dark-mode'); b.classList.remove('light-mode'); }
    else { b.classList.add('light-mode'); b.classList.remove('dark-mode'); }
  }
  const currentTheme = () => document.body.classList.contains('dark-mode') ? 'dark' : 'light';

  // -------------------------
  // CSS helpers
  // -------------------------
  function injectDropdownIconDarkFix() {
    if (document.getElementById('dropdown-dark-fix')) return;
    const style = document.createElement('style');
    style.id = 'dropdown-dark-fix';
    style.textContent = `
      .root-section-toggle .material-symbols-outlined,
      .root-section-toggle .material-symbols-rounded { color: currentColor !important; }
      .dark-mode .root-section-toggle { color: #fff !important; }
      .light-mode .root-section-toggle { color: inherit; }
    `;
    document.head.appendChild(style);
  }

  // Colors for FLATICON icons (sun = amber, moon = black outline look)
  function injectThemeIconColors() {
    if (document.getElementById('theme-icon-color-fix')) return;
    const style = document.createElement('style');
    style.id = 'theme-icon-color-fix';
    style.textContent = `
      /* ensure the toggle is clickable */
      .header .theme-toggle,
      .header [data-theme-toggle],
      .header #theme-toggle,
      .header .toggle-theme { cursor: pointer; position: relative; z-index: 5; }

      /* color the specific flaticon <i> if present */
      .header .theme-toggle i.icon-sun,
      [data-theme-toggle] i.icon-sun,
      #theme-toggle i.icon-sun,
      .toggle-theme i.icon-sun {
        color: #f5b301 !important; /* amber/gold */
      }
      .header .theme-toggle i.icon-moon,
      [data-theme-toggle] i.icon-moon,
      #theme-toggle i.icon-moon,
      .toggle-theme i.icon-moon {
        color: #000 !important;     /* black outline look */
      }

      /* If you still have Material Symbols as fallback, keep solid black */
      .header .theme-toggle .material-symbols-outlined,
      .header .theme-toggle .material-symbols-rounded,
      [data-theme-toggle] .material-symbols-outlined,
      [data-theme-toggle] .material-symbols-rounded {
        color: #000 !important;
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 40;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
  }

  // -------------------------
  // Includes
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
  // Side menu
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
    const iconMenu = qsa('.header .material-symbols-outlined, .header .material-symbols-rounded', header)
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
  // THEME TOGGLE (with FLATICON support)
  // -------------------------
  const TOGGLE_SELECTORS = [
    '.theme-toggle',
    '[data-theme-toggle]',
    '#theme-toggle',
    '.toggle-theme',
    '[aria-label="Toggle theme"]'
  ];

  function ensureToggleIconEl(toggleEl) {
    if (!toggleEl) return null;
    // PRIORITY A: two separate <i> icons with data-role
    const sun = toggleEl.querySelector('i[data-role="sun"]');
    const moon = toggleEl.querySelector('i[data-role="moon"]');
    if (sun || moon) return { mode: 'pair', sun, moon };

    // PRIORITY B: one <i> with data-day-class / data-night-class
    const iOne = toggleEl.querySelector('i[data-day-class][data-night-class]');
    if (iOne) return { mode: 'swap', one: iOne };

    // PRIORITY C: fallback to Material Symbols inside the toggle (or create one)
    let ms = toggleEl.querySelector('.material-symbols-outlined, .material-symbols-rounded');
    if (!ms) {
      ms = document.createElement('span');
      ms.className = 'material-symbols-outlined';
      ms.textContent = 'light_mode';
      toggleEl.appendChild(ms);
    }
    return { mode: 'material', ms };
  }

  function showFlaticonPair(pair, mode) {
    if (!pair) return;
    const { sun, moon } = pair;
    if (sun) {
      sun.classList.add('icon-sun');
      sun.style.display = (mode === 'light') ? '' : 'none';
    }
    if (moon) {
      moon.classList.add('icon-moon');
      moon.style.display = (mode === 'dark') ? '' : 'none';
    }
  }

  function swapFlaticonClass(one, mode) {
    const dayClass   = one.getAttribute('data-day-class')   || '';
    const nightClass = one.getAttribute('data-night-class') || '';
    one.className = ''; // reset
    one.classList.add('fi'); // base flaticon class
    if (mode === 'dark') {
      nightClass.split(/\s+/).filter(Boolean).forEach(c => one.classList.add(c));
      one.classList.add('icon-moon');
    } else {
      dayClass.split(/\s+/).filter(Boolean).forEach(c => one.classList.add(c));
      one.classList.add('icon-sun');
    }
  }

  function setThemeIconAll(mode) {
    // Update all toggles with whatever structure they use
    const toggles = qsa(TOGGLE_SELECTORS.join(','));
    toggles.forEach(tg => {
      const ref = ensureToggleIconEl(tg);
      if (!ref) return;
      if (ref.mode === 'pair') {
        showFlaticonPair(ref, mode);
      } else if (ref.mode === 'swap') {
        swapFlaticonClass(ref.one, mode);
      } else if (ref.mode === 'material') {
        ref.ms.textContent = (mode === 'dark') ? 'dark_mode' : 'light_mode';
      }
    });
  }

  function bindThemeToggleDelegation() {
    // Initialize theme + icon
    const initial = (localStorage.getItem(THEME_KEY) === 'dark') ? 'dark' : 'light';
    applyTheme(initial);
    setThemeIconAll(initial);

    function findToggle(start) {
      for (const sel of TOGGLE_SELECTORS) {
        const hit = start.closest(sel);
        if (hit) return hit;
      }
      // Fallback: click on a direct icon inside header
      const icon = start.closest('i, .material-symbols-outlined, .material-symbols-rounded');
      if (icon && icon.closest('.header')) return icon;
      return null;
    }

    const handler = (e) => {
      const hit = findToggle(e.target);
      if (!hit) return;
      e.preventDefault();
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
      setThemeIconAll(next);
    };

    document.addEventListener('click', handler, true);
    document.addEventListener('touchend', handler, true);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      handler(e);
    }, true);
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
  // Home time (dd/MM/yyyy HH:mm:ss, centered, no flicker) + Countdown
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
    injectThemeIconColors();      // << colors for flaticon sun/moon
    bindSideMenu();
    bindThemeToggleDelegation();  // << robust toggle + icon sync (flaticon or fallback)
    initRootDropdowns();
    initHomeTimeIfPresent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();