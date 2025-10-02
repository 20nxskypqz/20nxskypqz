/* js-RootShared-02102025-08
   Fix (hard): Slide menu is open from first load & cannot be closed
   - Aggressive scope detection (detectMenuScope)
   - Force-close on boot: remove .open, aria-hidden=true, display:none
   - Open = display:block + .open; Close = display:none + remove .open
   - Robust close by: close button(s), overlay click, ESC, click-outside
   - Keep other features intact (root dropdowns, theme toggle, home time)
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
  // Scopes & selectors
  // -------------------------
  const MENU_SCOPE_SEL = [
    '#mobile-nav','.mobile-nav','.side-menu','.sidemenu','.slide-menu','.slideout',
    '.drawer','.drawer-nav','.offcanvas','.menu-panel','.nav-drawer',
    'nav[aria-label="mobile"]','[data-mobile-nav]','[data-menu="mobile"]'
  ].join(',');

  const PANEL_SEL = [
    '.nav-sublist','[data-nav-sublist]','.menu-sublist','.submenu','.sublist',
    '.submenu-list','.dropdown-panel','.menu-group','.submenu-items',
    'ul[role="group"]','div[role="group"]','[data-sublist]','[data-submenu]'
  ].join(',');

  const TOGGLE_SEL = [
    '[data-nav-toggle]','.nav-section-toggle','[aria-controls]','[data-target]',
    '.dropdown-toggle','.nav-toggle','.submenu-toggle','.expand-toggle',
    '.expand-arrow','.caret','.nav-arrow',
    '.has-submenu > a','.has-submenu > button',
    '.material-symbols-outlined','.material-icons'
  ].join(',');

  // -------------------------
  // Inject helper CSS (menu overlay + default hidden sublists)
  // -------------------------
  function injectHelpersCSS() {
    if (document.getElementById('root-shared-helpers')) return;
    const style = document.createElement('style');
    style.id = 'root-shared-helpers';
    style.textContent = `
      /* Overlay for slide menu */
      .menu-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,.4);
        opacity: 0; pointer-events: none;
        transition: opacity .2s ease;
      }
      .menu-overlay.show { opacity: 1; pointer-events: auto; }

      /* Root link cards (unchanged) */
      .root-link-card[hidden] { display:none !important; }

      /* Hide sublists inside any detected menu scope by default */
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
  // Slide menu: detect scope aggressively
  // -------------------------
  function detectMenuScope() {
    // 1) Known selectors
    let el = qs(MENU_SCOPE_SEL);
    if (el) return el;

    // 2) Heuristic: any nav/aside/div that looks like a drawer/menu
    const hint = /menu|drawer|side|offcanvas|panel|nav|mobile/i;
    const candidates = qsa('nav,aside,div');
    for (const c of candidates) {
      const id = (c.id || '');
      const cls = (c.className || '');
      if ((hint.test(id) || hint.test(cls)) && c !== qs('.header')) {
        // must contain at least one link or list
        if (c.querySelector('a, ul, ol, [role="group"]')) return c;
      }
    }
    return null;
  }

  // -------------------------
  // Overlay
  // -------------------------
  function ensureOverlay() {
    let ov = qs('.menu-overlay');
    if (!ov) { ov = document.createElement('div'); ov.className='menu-overlay'; document.body.appendChild(ov); }
    return ov;
  }

  // -------------------------
  // Open / Close (force)
  // -------------------------
  function forceMenuClosed(menu, overlay) {
    if (!menu) return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden','true');
    // kill any inline "showing" styles
    menu.style.display = 'none';
    menu.style.visibility = '';
    menu.style.transform = '';
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  }
  function forceMenuOpen(menu, overlay) {
    if (!menu) return;
    menu.style.display = 'block';   // beat any CSS that shows it by default
    menu.classList.add('open');
    menu.setAttribute('aria-hidden','false');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  // -------------------------
  // Bind hamburger & closing behaviors
  // -------------------------
  function bindSideMenu() {
    const header = qs('.header');
    const menu   = detectMenuScope();
    if (!menu || !header) return;

    const overlay = ensureOverlay();

    // *** FORCE CLOSED ON BOOT ***
    forceMenuClosed(menu, overlay);

    // Openers in header (support various markup)
    const openBtns = [
      ...qsa('.header .menu-button', header),
      ...qsa('.header [data-open-menu]', header),
      ...qsa('.header .hamburger', header),
      ...qsa('.header .menu-toggle', header),
      ...qsa('.header .material-symbols-outlined', header).filter(el => (el.textContent||'').trim()==='menu'),
    ];
    openBtns.forEach(btn => btn && btn.addEventListener('click', (e)=>{ e.preventDefault(); forceMenuOpen(menu, overlay); }));

    // Close buttons inside menu
    const closeBtns = [
      qs('#nav-close', menu),
      qs('.close-menu', menu),
      qs('.menu-close', menu),
      qs('[data-close-menu]', menu),
      qsa('.material-symbols-outlined', menu).find(el => (el.textContent||'').trim()==='close')
    ].filter(Boolean);
    closeBtns.forEach(btn => btn && btn.addEventListener('click', (e)=>{ e.preventDefault(); forceMenuClosed(menu, overlay); }));

    // Overlay click
    overlay.addEventListener('click', () => forceMenuClosed(menu, overlay));
    // ESC key
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') forceMenuClosed(menu, overlay); });
    // Click outside menu
    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('open')) return;
      const insideMenu  = !!e.target.closest(detectMenuScopeSelectorFallback());
      const insideHead  = !!e.target.closest('.header');
      if (!insideMenu && !insideHead) forceMenuClosed(menu, overlay);
    });
  }

  // helper: build a permissive selector for “inside menu” checks
  function detectMenuScopeSelectorFallback() {
    return MENU_SCOPE_SEL + ', nav, aside, div';
  }

  // -------------------------
  // Slide-menu dropdowns (scoped)
  // -------------------------
  function nearestMenuScope(fromEl) {
    const sel = detectMenuScopeSelectorFallback();
    return fromEl.closest?.(sel) || null;
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
  function findPanelHeuristic(btn, scope) {
    const ac = btn.getAttribute && btn.getAttribute('aria-controls');
    if (ac) { const el = scope.querySelector(`#${CSS.escape(ac)}`) || document.getElementById(ac); if (el) return el; }
    const dt = btn.getAttribute && btn.getAttribute('data-target');
    if (dt) { try { const el = scope.querySelector(dt); if (el) return el; } catch(_){} }
    const next = btn.nextElementSibling;
    if (next && next.matches?.(PANEL_SEL)) return next;
    const holders = [ btn.closest('.has-submenu'), btn.closest('li'), btn.parentElement ].filter(Boolean);
    for (const h of holders) {
      const el = h.querySelector(PANEL_SEL) || h.querySelector('ul,ol,[data-sublist],[data-submenu]');
      if (el) return el;
    }
    return null;
  }
  function openPanel(panel, btn) {
    panel.hidden = false;
    panel.style.display = 'block';
    panel.classList.add('open','is-open');
    panel.style.maxHeight = panel.scrollHeight + 'px';
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
    const scope = detectMenuScope();
    if (scope) closeAllSubLists(scope);

    document.addEventListener('click', (e) => {
      const scopeEl = nearestMenuScope(e.target);
      // handle only when actually inside the slide-menu area (not root page)
      if (!scopeEl || !scopeEl.classList.contains('open')) return;

      let btn = e.target.closest(TOGGLE_SEL);
      if (!btn) return;

      // If matched a Material icon, accept only arrow-ish toggles
      if (btn.classList.contains('material-symbols-outlined') || btn.classList.contains('material-icons')) {
        const txt = (btn.textContent || '').trim();
        const isArrow = (txt === 'arrow_drop_down' || txt === 'expand_more' || txt === 'chevron_right' || txt === 'chevron_left');
        if (!isArrow) return;
      }

      // Real link? allow navigate unless explicit toggle attrs
      const tag = btn.tagName.toLowerCase();
      const href = btn.getAttribute('href');
      const isRealLink = (tag === 'a' && href && href !== '#' &&
        !btn.hasAttribute('data-nav-toggle') && !btn.hasAttribute('aria-controls') && !btn.hasAttribute('data-target'));
      if (isRealLink) return;

      e.preventDefault(); e.stopPropagation();

      const panel = findPanelHeuristic(btn, scopeEl);
      if (!panel) return;

      const willOpen = !panel.classList.contains('is-open');
      qsa(PANEL_SEL, scopeEl).forEach(p => { if (p !== panel) closePanel(p); });
      if (willOpen) openPanel(panel, btn);
      else closePanel(panel, btn);
    });

    window.addEventListener('resize', () => {
      qsa(MENU_SCOPE_SEL).forEach(scope2 => {
        const opened = scope2.querySelector(`${PANEL_SEL}.is-open`);
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
    await loadIncludes();        // header/footer first
    injectHelpersCSS();          // overlay + defaults
    bindSideMenu();              // *** force closed, bind open/close ***
    bindMobileNavDropdowns();    // slide-menu sublists
    bindThemeToggle();           // theme
    initRootDropdowns();         // root-page dropdowns
    initHomeTimeIfPresent();     // time/countdown (if present)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();