/* js-RootShared-01102025-15
   - FIX: Stop alternating (e.g., "0" vs "00") by enforcing a SINGLE timer & padded parts
   - Uses singleton timer with last-value check to avoid any flicker/overwrites
   - Keeps pre-v7 baseline + dropdown icon dark-mode color fix
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

  // Inject CSS เพื่อบังคับให้ไอคอน dropdown เปลี่ยนสีตามโหมด
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
  // Theme (Light/Dark)
  // -------------------------
  function bindThemeToggle() {
    const header = qs('.header');
    if (!header) return;

    const toggleBtn = qs('.header .theme-toggle', header);
    const themeIcons = qsa('.header .material-symbols-outlined', header)
      .filter(el => {
        const name = (el.textContent || '').trim().toLowerCase();
        return name === 'dark_mode' || name === 'light_mode';
      });

    applyTheme(localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light');

    const handle = () => {
      const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    };

    if (toggleBtn) toggleBtn.addEventListener('click', handle);
    themeIcons.forEach(ic => ic.addEventListener('click', handle));
  }

  // -------------------------
  // ROOT page: dropdown sections (ซ่อนก่อนเสมอ)
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
  // Home: Date & Time (always dd/MM/yyyy HH:mm:ss, zero-padded) + Countdown
  // Enforce SINGLE timer with last-value caching to prevent any alternating writes
  // -------------------------
  function initHomeTimeIfPresent() {
    const timeEl = qs('#current-time');
    const cdEl   = qs('#countdown-display');
    if (!timeEl && !cdEl) return;

    // Global-ish singleton state to avoid multiple intervals
    if (!window.__HOME_TIME_STATE__) {
      window.__HOME_TIME_STATE__ = { timer: null, lastTimeStr: '', lastCdStr: '' };
    }
    const STATE = window.__HOME_TIME_STATE__;
    if (STATE.timer) { clearInterval(STATE.timer); STATE.timer = null; } // clear old timer if any

    const TZ = 'Asia/Bangkok';
    const pad2 = n => n.toString().padStart(2, '0');

    // Build parts strictly and pad ourselves
    const dtfFull = new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });

    function formatDateTH24(d){
      const parts = dtfFull.formatToParts(d).reduce((acc,p)=>{ acc[p.type]=p.value; return acc; }, {});
      const dd = pad2(parts.day || '0');
      const mm = pad2(parts.month || '0');
      const yy = parts.year || '';
      const hh = pad2(parts.hour || '0');
      const mi = pad2(parts.minute || '0');
      const ss = pad2(parts.second || '0');
      return `${dd}/${mm}/${yy} ${hh}:${mi}:${ss}`;
    }

    function buildCountdown(now){
      const target = new Date('2026-01-01T00:00:00+07:00').getTime();
      let diff = Math.max(0, target - now.getTime());
      const days = Math.floor(diff / 86400000); diff %= 86400000;
      const hours = Math.floor(diff / 3600000);  diff %= 3600000;
      const minutes = Math.floor(diff / 60000);  diff %= 60000;
      const seconds = Math.floor(diff / 1000);
      return `${days} Days ${pad2(hours)} Hours ${pad2(minutes)} Minutes ${pad2(seconds)} Seconds`;
    }

    function tick(){
      const now = new Date();

      if (timeEl) {
        const next = formatDateTH24(now);
        if (next !== STATE.lastTimeStr) {
          STATE.lastTimeStr = next;
          timeEl.textContent = next; // write only if changed
        }
      }

      if (cdEl) {
        const nextCd = buildCountdown(now);
        if (nextCd !== STATE.lastCdStr) {
          STATE.lastCdStr = nextCd;
          cdEl.textContent = nextCd;
          cdEl.style.textAlign = 'center';
        }
      }
    }

    // Start single interval
    tick();
    STATE.timer = setInterval(tick, 1000);
  }

  // -------------------------
  // Boot
  // -------------------------
  async function boot() {
    await loadIncludes();
    injectDropdownIconDarkFix();
    bindSideMenu();
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