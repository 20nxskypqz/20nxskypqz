/* js-RootShared-01102025-21
   - Theme toggle icon:
       • Light mode => Sun (light_mode)
       • Dark mode  => Moon (dark_mode)
       • Always black outline (both modes), not faded
   - Keeps ver.20: Shadow DOM time (no flicker, centered), dropdown dark-mode color fix, single includes
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

  // -------------------------
  // Inject CSS: dropdown icon follows text color; white in dark mode
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

  // Force THEME TOGGLE icon to be solid black outline in both modes
  function injectThemeToggleIconFix() {
    if (document.getElementById('theme-toggle-icon-fix')) return;
    const style = document.createElement('style');
    style.id = 'theme-toggle-icon-fix';
    style.textContent = `
      .header .theme-toggle .material-symbols-outlined {
        color: #000 !important;
        font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 40;
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

    qsa('.menu-section-toggle', menu).forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        const sub = btn.parentElement.querySelector('.menu-sublist');
        if (sub) sub.hidden = expanded ? true : false;
      });
    });
  }

  // -------------------------
  // Theme (Light/Dark) + ICON SYNC
  // -------------------------
  function bindThemeToggle() {
    const header = qs('.header');
    if (!header) return;

    const toggleBtn = qs('.header .theme-toggle', header);

    const setThemeIcon = (mode) => {
      if (!toggleBtn) return;
      const iconEl = toggleBtn.querySelector('.material-symbols-outlined');
      if (!iconEl) return;
      // Show SUN in light mode, MOON in dark mode
      iconEl.textContent = (mode === 'dark') ? 'dark_mode' : 'light_mode';
    };

    const current = (localStorage.getItem(THEME_KEY) === 'dark') ? 'dark' : 'light';
    applyTheme(current);
    setThemeIcon(current);

    const handle = () => {
      const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
      setThemeIcon(next);
    };

    if (toggleBtn) toggleBtn.addEventListener('click', handle);

    // Also allow clicking directly on the icon inside the button (if separate)
    const iconInside = toggleBtn ? toggleBtn.querySelector('.material-symbols-outlined') : null;
    if (iconInside) iconInside.addEventListener('click', (e) => { e.stopPropagation(); handle(); });
  }

  // -------------------------
  // ROOT page: dropdown sections (hidden by default)
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
  // Home: Date & Time (dd/MM/yyyy HH:mm:ss, 2-digit, no flicker) + Countdown
  // Shadow DOM renderer — centered text
  // -------------------------
  function initHomeTimeIfPresent() {
    const hostTime = qs('#current-time');
    const hostCd   = qs('#countdown-display');
    if (!hostTime && !hostCd) return;

    // Clear any existing timers
    if (window.__HOME_TIME_LOOP__) { clearTimeout(window.__HOME_TIME_LOOP__); window.__HOME_TIME_LOOP__ = null; }

    // Attach Shadow DOM to isolate visible content
    function ensureShadow(host, id){
      if (!host) return null;
      if (!host.shadowRoot) {
        const shadow = host.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = `
          :host { display: block; width: 100%; }
          .wrap {
            display: block;
            text-align: center;         /* centered time text */
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
    injectThemeToggleIconFix();  // << ensure black-outline icon for theme toggle
    bindSideMenu();
    bindThemeToggle();           // << sets correct icon per mode
    initRootDropdowns();
    initHomeTimeIfPresent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();