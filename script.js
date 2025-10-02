/* js-RootShared-02102025-06
   Fix: Slide menu shows as open on load & can't be closed
     - Force-close menu on boot (remove .open, aria-hidden=true, overlay hide)
     - Robust close triggers inside menu (buttons & Material Symbols 'close')
     - Keep existing features unchanged:
       includes -> bind order, theme toggle, slide-menu dropdowns, root dropdowns,
       home time & countdown (TH, 24h, aligned tick)
*/

(function () {
  "use strict";

  // -------------------------
  // Utils
  // -------------------------
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const THEME_KEY = 'theme@20nxskypqz';

  const MENU_SCOPE_SEL = '#mobile-nav, .mobile-nav, .side-menu, .drawer, nav[aria-label="mobile"], .menu-panel';
  const PANEL_SEL = '.nav-sublist, [data-nav-sublist], .menu-sublist, .submenu, .sublist, ul[role="group"], div[role="group"]';
  const TOGGLE_SEL = '[data-nav-toggle], .nav-section-toggle, [aria-controls], [data-target], .dropdown-toggle, .nav-toggle, .has-submenu > a, .has-submenu > button, .nav-arrow, .material-symbols-outlined';

  const getMenuScope = (root=document) => qs(MENU_SCOPE_SEL, root) || qs(MENU_SCOPE_SEL) || null;

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
  // CSS helpers (inject once)
  // -------------------------
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

      /* Slide-menu sublists default hidden (animated panels are handled elsewhere) */
      ${MENU_SCOPE_SEL} ${PANEL_SEL} { display: none; }
      ${MENU_SCOPE_SEL} .open { display: block; }
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
    const menu    = getMenuScope();
    if (!menu || !header) return;

    const overlay = ensureOverlay();

    // --- FORCE CLOSED ON BOOT ---
    forceMenuClosed(menu, overlay);

    const openBtns = [
      ...qsa('.header .menu-button', header),
      ...qsa('.header [data-open-menu]', header),
      ...qsa('.header .hamburger', header),
      ...qsa('.header .menu-toggle', header),
      ...qsa('.header .material-symbols-outlined', header).filter(el => (el.textContent||'').trim()==='menu'),
    ];

    // many possible close buttons inside the menu
    const closeBtns = [
      qs('#nav-close', menu),
      qs('.close-menu', menu),
      qs('.menu-close', menu),
      qs('[data-close-menu]', menu),
      // Material Symbols "close" icon inside menu
      qsa('.material-symbols-outlined', menu).find(el => (el.textContent||'').trim()==='close')
    ].filter(Boolean);

    const open = () => {
      menu.classList.add('open');
      menu.setAttribute('aria-hidden','false');
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      forceMenuClosed(menu, overlay);
    };

    openBtns.forEach(btn => btn && btn.addEventListener('click', (e)=>{ e.preventDefault(); open(); }));
    closeBtns.forEach(btn => btn && btn.addEventListener('click', (e)=>{ e.preventDefault(); close(); }));

    // close on overlay click
    overlay.addEventListener('click', close);
    // close on ESC
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') close(); });

    // optional: click outside menu closes it
    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('open')) return;
      const clickedInsideMenu  = !!e.target.closest(MENU_SCOPE_SEL);
      const clickedHeaderMenu  = !!e.target.closest('.header');
      if (!clickedInsideMenu && !clickedHeaderMenu) close();
    });
  }

  function forceMenuClosed(menu, overlay) {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden','true');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  // -------------------------
  // Slide-menu dropdowns (scoped) — unchanged from previous working logic
  // -------------------------
  function nearestMenuScope(fromEl) {
    return fromEl.closest?.(MENU_SCOPE_SEL) || null;
  }
  function closeAllSubLists(scope) {
    qsa(PANEL_SEL, scope).forEach(el => {
      el.classList.remove('open','is-open');
      el.style.maxHeight = '0px';
      el.style.display = 'none';
      el.hidden = true;
    });
    qsa(TOGGLE_SEL, scope).forEach(tg => tg.setAttribute && tg.setAttribute('aria-expanded','false'));
  }
  function panelForToggle(btn, scope) {
    const ac = btn.getAttribute && btn.getAttribute('aria-controls');
    if (ac) { const el = scope.querySelector(`#${CSS.escape(ac)}`) || document.getElementById(ac); if (el) return el; }
    const dt = btn.getAttribute && btn.getAttribute('data-target');
    if (dt) { try { const el = scope.querySelector(dt); if (el) return el; } catch(_){} }
    const next = btn.nextElementSibling;
    if (next && next.matches?.(PANEL_SEL)) return next;
    const holder = btn.closest && btn.closest('.has-submenu');
    if (holder) { const el = holder.querySelector(PANEL_SEL); if (el) return el; }
    return null;
  }
  function openPanel(panel, btn) {
    panel.hidden = false;
    panel.style.display = 'block';
    panel.classList.add('open','is-open');
    const h = panel.scrollHeight;
    panel.style.maxHeight = h + 'px';
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
    btn && btn.setAttribute('aria-expanded','true');
  }
  function closePanel(panel, btn) {
    panel.classList.remove('is-open');
    panel.style.maxHeight = '0px';
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(-2px)';
    setTimeout(() => {
      panel.classList.remove('open');
      panel.style.display = 'none';
      panel.hidden = true;
    }, 260);
    btn && btn.setAttribute('aria-expanded','false');
  }
  function bindMobileNavDropdowns() {
    qsa(MENU_SCOPE_SEL).forEach(scope => closeAllSubLists(scope));
    document.addEventListener('click', (e) => {
      const scope = nearestMenuScope(e.target);
      if (!scope) return;

      let btn = e.target.closest(TOGGLE_SEL);
      if (!btn) return;

      if (btn.classList.contains('material-symbols-outlined')) {
        const txt = (btn.textContent || '').trim();
        const isArrow = (txt === 'arrow_drop_down' || txt === 'expand_more' || txt === 'chevron_right' || txt === 'chevron_left');
        if (!isArrow) return;
      }

      const tag = btn.tagName.toLowerCase();
      const href = btn.getAttribute('href');
      const isRealLink = (tag === 'a' && href && href !== '#' && !btn.hasAttribute('data-nav-toggle') && !btn.hasAttribute('aria-controls') && !btn.hasAttribute('data-target'));
      if (isRealLink) return;

      e.preventDefault(); e.stopPropagation();

      const panel = panelForToggle(btn, scope);
      if (!panel) return;

      const willOpen = !panel.classList.contains('is-open');
      qsa(PANEL_SEL, scope).forEach(p => { if (p !== panel) closePanel(p); });
      if (willOpen) openPanel(panel, btn);
      else closePanel(panel, btn);
    });

    window.addEventListener('resize', () => {
      qsa(MENU_SCOPE_SEL).forEach(scope => {
        const opened = scope.querySelector(`${PANEL_SEL}.is-open`);
        if (opened) opened.style.maxHeight = opened.scrollHeight + 'px';
      });
    });
  }

  // -------------------------
  // Root page dropdowns — unchanged
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
  // Theme toggle — unchanged
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
  // Home time & countdown — unchanged
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
    await loadIncludes();        // โหลด header/footer ก่อน
    injectHelpersCSS();          // helper styles
    bindSideMenu();              // ปุ่มสามขีด/overlay + FORCE CLOSED on boot
    bindMobileNavDropdowns();    // dropdowns in slide menu
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