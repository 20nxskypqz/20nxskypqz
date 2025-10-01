/* js-RootShared-01102025-28
   CHANGELOG:
   - Remove all Google sun/moon (light_mode/dark_mode) handling
   - Use ONLY Flaticon:
       Sun  = <i class="fi fi-sr-brightness" data-role="sun"></i>   (orange #ff9800)
       Moon = <i class="fi fi-sr-moon-stars" data-role="moon"></i> (yellow #ffd600)
   - Auto-inject Flaticon CSS link into <head> (once)
   - Color + size via injected <style id="theme-flaticon-styles">
   - Robust delegated events for toggle (click/touch/keyboard) after includes
   - Keep: no-flicker centered time (Shadow DOM), dropdown dark-mode color fix, side menu, root dropdowns
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
  const currentTheme = () => document.body.classList.contains('dark-mode') ? 'dark' : 'light';

  // -------------------------
  // Inject CSS helpers
  // -------------------------
  function ensureFlaticonCSS() {
    const hrefFrag = 'uicons-solid-rounded/css/uicons-solid-rounded.css';
    if (![...document.styleSheets].some(s => s?.href?.includes(hrefFrag))) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-rounded/css/uicons-solid-rounded.css';
      document.head.appendChild(link);
    }
  }

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

  function injectThemeFlaticonStyles() {
    if (document.getElementById('theme-flaticon-styles')) return;
    const style = document.createElement('style');
    style.id = 'theme-flaticon-styles';
    style.textContent = `
      .header .theme-toggle,
      .header [data-theme-toggle],
      .header #theme-toggle,
      .header .toggle-theme {
        cursor: pointer; position: relative; z-index: 5; display: inline-flex; align-items: center;
      }
      .header .theme-toggle i.fi,
      [data-theme-toggle] i.fi,
      #theme-toggle i.fi,
      .toggle-theme i.fi { font-size: 28px; line-height: 1; }

      /* requested colors */
      i[data-role="sun"]  { color: #ff9800 !important; } /* orange */
      i[data-role="moon"] { color: #ffd600 !important; } /* yellow */
    `;
    document.head.appendChild(style);
  }

  // -------------------------
  // Includes (header/footer/side-menu)
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
  // THEME TOGGLE — Flaticon brightness/moon-stars ONLY
  // -------------------------
  const TOGGLE_SELECTORS = [
    '.theme-toggle',
    '[data-theme-toggle]',
    '#theme-toggle',
    '.toggle-theme',
    '[aria-label="Toggle theme"]'
  ];

  function ensureFlaticonPair(toggleEl) {
    if (!toggleEl) return { sun: null, moon: null };
    let sun  = toggleEl.querySelector('i[data-role="sun"]');
    let moon = toggleEl.querySelector('i[data-role="moon"]');

    if (!sun) {
      sun = document.createElement('i');
      sun.className = 'fi fi-sr-brightness';
      sun.setAttribute('data-role', 'sun');
      sun.style.display = 'none';
      toggleEl.appendChild(sun);
    } else if (!/fi-sr-brightness/.test(sun.className)) {
      sun.className = 'fi fi-sr-brightness';
    }

    if (!moon) {
      moon = document.createElement('i');
      moon.className = 'fi fi-sr-moon-stars';
      moon.setAttribute('data-role', 'moon');
      moon.style.display = 'none';
      toggleEl.appendChild(moon);
    } else if (!/fi-sr-moon-stars/.test(moon.className)) {
      moon.className = 'fi fi-sr-moon-stars';
    }

    return { sun, moon };
  }

  function setThemeIconFlaticon(mode) {
    const toggles = qsa(TOGGLE_SELECTORS.join(','));
    toggles.forEach(tg => {
      const { sun, moon } = ensureFlaticonPair(tg);
      if (!sun || !moon) return;
      if (mode === 'dark') {
        moon.style.display = 'inline-block';
        sun.style.display  = 'none';
      } else {
        sun.style.display  = 'inline-block';
        moon.style.display = 'none';
      }
    });
  }

  function bindThemeToggleDelegation() {
    const initial = (localStorage.getItem(THEME_KEY) === 'dark') ? 'dark' : 'light';
    applyTheme(initial);
    setThemeIconFlaticon(initial);

    function findToggle(start) {
      for (const sel of TOGGLE_SELECTORS) {
        const hit = start.closest(sel);
        if (hit) return hit;
      }
      // allow click directly on <i class="fi ..."> inside header
      const icon = start.closest('i.fi');
      if (icon && icon.closest('.header')) return icon.closest('.header'); // parent region acts as toggle
      return null;
    }

    const handler = (e) => {
      const hit = findToggle(e.target);
      if (!hit) return;
      e.preventDefault();
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
      setThemeIconFlaticon(next);
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
    aconst hostCd   = qs('#countdown-display');
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
    ensureFlaticonCSS();          // make sure Flaticon set is present (head link)
    await loadIncludes();
    injectDropdownIconDarkFix();
    injectThemeFlaticonStyles();  // colors & sizes for Flaticon theme icons
    bindSideMenu();
    bindThemeToggleDelegation();  // robust toggle using Flaticon icons only
    initRootDropdowns();
    initHomeTimeIfPresent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();