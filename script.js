/* js-RootShared-02102025-02
   Base: v22
   Fix: Mobile-nav dropdowns inside the 3-bars menu still not clickable
        - Pure delegated click (document-level) so it works even if DOM is injected/replaced
        - Very tolerant selectors for toggles/panels
        - Hide all sublists by default inside the slide menu
   Keep:
        - includes -> bind order
        - theme toggle (Material Symbols: #mode-toggle/#mode-icon and legacy .theme-toggle)
        - hamburger open/close + overlay
        - root-page dropdowns
        - home time & countdown (TH 24h, no flicker)
*/

(function () {
  "use strict";

  // -------------------------
  // Utils
  // -------------------------
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const THEME_KEY = 'theme@20nxskypqz';

  const getMobileNav = () => qs('#mobile-nav') || qs('.mobile-nav') || qs('.side-menu') || null;

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
  // CSS helpers (inject)
  // -------------------------
  const PANEL_SEL = [
    '.nav-sublist','[data-nav-sublist]','.menu-sublist','.submenu','.sublist',
    '.root-link-card','ul[role="group"]','div[role="group"]'
  ].join(',');

  function injectHelpersCSS() {
    if (document.getElementById('root-shared-helpers')) return;
    const style = document.createElement('style');
    style.id = 'root-shared-helpers';
    style.textContent = `
      /* Root-page dropdown icon color sync */
      .root-section-toggle .material-symbols-outlined { color: currentColor !important; }
      .dark-mode .root-section-toggle { color:#fff !important; }
      .light-mode .root-section-toggle { color:inherit; }

      /* Theme button cursor */
      .header .theme-toggle { cursor:pointer; }
      .header .theme-toggle .material-symbols-outlined,
      #mode-toggle .material-symbols-outlined {
        color:#000 !important;
        font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 40;
        user-select:none;
      }

      /* Ensure slide-menu sublists are hidden by default */
      #mobile-nav ${PANEL_SEL}, .mobile-nav ${PANEL_SEL}, .side-menu ${PANEL_SEL} { display: none; }
      #mobile-nav .open, .mobile-nav .open, .side-menu .open { display: block; }
    `;
    document.head.appendChild(style);
  }

  // -------------------------
  // HTML includes (header/footer/etc.)
  // -------------------------
  async function loadIncludes() {
    const includeEls = qsa('[data-include]');
    if (includeEls.length === 0) return;
    await Promise.all(includeEls.map(async (el) => {
      const url = el.getAttribute('data-include');
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        const html = await res.text();
        el.outerHTML = html;
      } catch (e) { console.error('Include failed:', url, e); }
    }));
  }

  // -------------------------
  // Hamburger (open/close slide menu)
  // -------------------------
  function ensureOverlay() {
    let ov = qs('.menu-overlay');
    if (!ov) { ov = document.createElement('div'); ov.className='menu-overlay'; document.body.appendChild(ov); }
    return ov;
  }
  function bindSideMenu() {
    const header  = qs('.header');
    const menu    = getMobileNav();
    if (!menu || !header) return;

    const overlay = ensureOverlay();

    const openBtns = [
      ...qsa('.header .menu-button', header),
      ...qsa('.header [data-open-menu]', header),
      ...qsa('.header .hamburger', header),
      ...qsa('.header .menu-toggle', header),
      ...qsa('.header .material-symbols-outlined', header).filter(el => (el.textContent||'').trim()==='menu'),
    ];
    const closeBtn = qs('#nav-close') || qs('.side-menu .close-menu');

    const open = () => {
      menu.classList.add('open'); overlay.classList.add('show');
      if (menu.setAttribute) menu.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      menu.classList.remove('open'); overlay.classList.remove('show');
      if (menu.setAttribute) menu.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
    };

    openBtns.forEach(btn => btn && btn.addEventListener('click', (e)=>{e.preventDefault(); open();}));
    if (closeBtn) closeBtn.addEventListener('click', (e)=>{e.preventDefault(); close();});
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') close(); });
  }

  // -------------------------
  // Mobile-nav: robust DROPDOWNS (document-level delegation)
  // -------------------------
  const TOGGLE_SEL = [
    '[data-nav-toggle]', '.nav-section-toggle', '[aria-controls]', '[data-target]',
    '.dropdown-toggle', '.nav-toggle', '.has-submenu > a', '.has-submenu > button'
  ].join(',');

  function hideAllSubLists(nav) {
    qsa(PANEL_SEL, nav).forEach(el => { el.classList.remove('open'); el.style.display = 'none'; });
    qsa(TOGGLE_SEL, nav).forEach(tg => tg.setAttribute('aria-expanded','false'));
  }

  function panelForToggle(btn, scope) {
    const root = scope || document;
    const ac = btn.getAttribute('aria-controls');
    if (ac) { const el = root.getElementById?.(ac) || document.getElementById(ac); if (el) return el; }
    const dt = btn.getAttribute('data-target');
    if (dt) { const el = qs(dt, root); if (el) return el; }
    const next = btn.nextElementSibling;
    if (next && next.matches?.(PANEL_SEL)) return next;
    const holder = btn.closest('.has-submenu');
    if (holder) {
      const el = holder.querySelector(PANEL_SEL);
      if (el) return el;
    }
    return null;
  }

  function bindMobileNavDropdowns() {
    const nav = getMobileNav();
    if (nav) hideAllSubLists(nav);

    // Delegate at document level (works even if nav is injected later)
    document.addEventListener('click', (e) => {
      const scope = getMobileNav();
      if (!scope) return;
      const inMenu = !!e.target.closest('#mobile-nav, .mobile-nav, .side-menu');
      if (!inMenu) return;

      // Accept both explicit toggles and the arrow icon itself
      let btn = e.target.closest(TOGGLE_SEL);
      if (!btn) {
        const ic = e.target.closest('.material-symbols-outlined');
        // treat arrow_drop_down as a toggle if present next to a sublist
        if (ic && (ic.textContent||'').trim()==='arrow_drop_down') {
          btn = ic;
        }
      }
      if (!btn) return;

      // If <a href> real navigation (not a pure toggle), let it navigate
      const tag = btn.tagName.toLowerCase();
      const href = btn.getAttribute('href');
      const actsAsLink = (tag === 'a' && href && href !== '#' && !btn.hasAttribute('data-nav-toggle'));
      if (actsAsLink) return;

      e.preventDefault(); e.stopPropagation();

      const panel = panelForToggle(btn, scope);
      if (!panel) return;

      const willOpen = !panel.classList.contains('open');
      hideAllSubLists(scope);
      if (willOpen) {
        panel.classList.add('open');
        panel.style.display = 'block';
        btn.setAttribute('aria-expanded','true');
      }
    });
  }

  // -------------------------
  // Root page dropdowns (outside the 3-bars menu)
  // -------------------------
  function initRootDropdowns() {
    qsa('.root-link-card').forEach(panel => { panel.hidden = true; panel.style.display = 'none'; });
    qsa('.root-section-toggle').forEach(btn => {
      btn.setAttribute('type','button');
      btn.setAttribute('aria-expanded','false');
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const sel = btn.getAttribute('data-target');
        const panel = sel ? qs(sel) : null;
        if (!panel) return;
        const willOpen = panel.hidden || panel.style.display === 'none';
        qsa('.root-link-card').forEach(p => { p.hidden = true; p.style.display = 'none'; });
        qsa('.root-section-toggle[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded','false'));
        if (willOpen) {
          panel.hidden = false;
          panel.style.display = '';
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('.root-section-toggle') || e.target.closest('.root-link-card')) return;
      qsa('.root-link-card').forEach(panel => { panel.hidden = true; panel.style.display = 'none'; });
      qsa('.root-section-toggle[aria-expanded="true"]').forEach(btn => btn.setAttribute('aria-expanded','false'));
    });
  }

  // -------------------------
  // Theme toggle
  // -------------------------
  function bindThemeToggle() {
    const initial = (localStorage.getItem(THEME_KEY) === 'dark') ? 'dark' : 'light';
    applyTheme(initial);
    setThemeIconAll(initial);

    function isToggle(el){
      return !!(el.closest('.theme-toggle') || el.closest('#mode-toggle') || el.closest('[data-theme-toggle]'));
    }
    document.addEventListener('click', (e) => {
      if (!isToggle(e.target)) return;
      e.preventDefault();
      const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
      setThemeIconAll(next);
    }, true);

    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && isToggle(e.target)) {
        e.preventDefault();
        const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
        setThemeIconAll(next);
      }
    }, true);
  }

  // -------------------------
  // Home time & countdown (TH 24h, no flicker)
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
    await loadIncludes();        // ต้องโหลด header/footer ก่อน
    injectHelpersCSS();          // styles helper + hide sublists default
    bindSideMenu();              // ปุ่มสามขีด/overlay
    bindMobileNavDropdowns();    // *** robust dropdowns in slide menu ***
    bindThemeToggle();           // โหมดสว่าง/มืด
    initRootDropdowns();         // dropdown หน้า root
    initHomeTimeIfPresent();     // เวลา/นับถอยหลัง (ถ้ามี)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();