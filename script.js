/* js-RootShared-02102025-09
   Fix: Slide menu shows empty content because panels were hidden too broadly
   - Do NOT globally hide groups inside the slide menu anymore.
   - Hide only the sublists that are *actually* controlled by a toggle.
   - Narrow PANEL selectors (remove .menu-group/.dropdown-panel/.submenu-items).
   - Keep all other features intact.
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

  // ⬇️ แคบลง: เลือกเฉพาะ "ซับลิสต์" เท่านั้น ไม่รวมกรุ๊ปหัวข้อหลัก
  const PANEL_SEL = [
    '.nav-sublist','[data-nav-sublist]','[data-sublist]',
    '.submenu','.sublist',
    'ul[role="group"]','div[role="group"]'
  ].join(',');

  const TOGGLE_SEL = [
    '[data-nav-toggle]','.nav-section-toggle','[aria-controls]','[data-target]',
    '.dropdown-toggle','.nav-toggle','.submenu-toggle','.expand-toggle',
    '.expand-arrow','.caret','.nav-arrow',
    '.has-submenu > a','.has-submenu > button',
    '.material-symbols-outlined','.material-icons'
  ].join(',');

  // -------------------------
  // Inject helper CSS
  // -------------------------
  function injectHelpersCSS() {
    if (document.getElementById('root-shared-helpers')) return;
    const style = document.createElement('style');
    style.id = 'root-shared-helpers';
    style.textContent = `
      /* Root dropdown icon color sync */
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

      /* Overlay for slide menu */
      .menu-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,.4);
        opacity: 0; pointer-events: none;
        transition: opacity .2s ease;
      }
      .menu-overlay.show { opacity: 1; pointer-events: auto; }

      /* อย่าไปซ่อนทุกอย่างในเมนูอีกแล้ว! ปล่อยให้ panels ถูกซ่อน/โชว์ด้วย JS เท่านั้น */
      .root-link-card[hidden] { display:none !important; }
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
  // Slide menu detection & overlay
  // -------------------------
  function detectMenuScope() {
    let el = qs(MENU_SCOPE_SEL);
    if (el) return el;
    const hint = /menu|drawer|side|offcanvas|panel|nav|mobile/i;
    const candidates = qsa('nav,aside,div');
    for (const c of candidates) {
      const id = (c.id || '');
      const cls = (c.className || '');
      if ((hint.test(id) || hint.test(cls)) && c !== qs('.header')) {
        if (c.querySelector('a, ul, ol, [role="group"]')) return c;
      }
    }
    return null;
  }
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
    menu.style.display = 'none';
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
  }
  function forceMenuOpen(menu, overlay) {
    if (!menu) return;
    menu.style.display = 'block';
    menu.classList.add('open');
    menu.setAttribute('aria-hidden','false');
    if (overlay) overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  // -------------------------
  // Bind hamburger & closing
  // -------------------------
  function bindSideMenu() {
    const header = qs('.header');
    const menu   = detectMenuScope();
    if (!menu || !header) return;

    const overlay = ensureOverlay();
    // ปิดเมนูไว้ก่อนเสมอ
    forceMenuClosed(menu, overlay);

    const openBtns = [
      ...qsa('.header .menu-button', header),
      ...qsa('.header [data-open-menu]', header),
      ...qsa('.header .hamburger', header),
      ...qsa('.header .menu-toggle', header),
      ...qsa('.header .material-symbols-outlined', header).filter(el => (el.textContent||'').trim()==='menu'),
    ];
    openBtns.forEach(btn => btn && btn.addEventListener('click', (e)=>{ e.preventDefault(); forceMenuOpen(menu, overlay); }));

    const closeBtns = [
      qs('#nav-close', menu),
      qs('.close-menu', menu),
      qs('.menu-close', menu),
      qs('[data-close-menu]', menu),
      qsa('.material-symbols-outlined', menu).find(el => (el.textContent||'').trim()==='close')
    ].filter(Boolean);
    closeBtns.forEach(btn => btn && btn.addEventListener('click', (e)=>{ e.preventDefault(); forceMenuClosed(menu, overlay); }));

    overlay.addEventListener('click', () => forceMenuClosed(menu, overlay));
    document.addEventListener('keydown', (e)=>{ if (e.key==='Escape') forceMenuClosed(menu, overlay); });

    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('open')) return;
      const insideMenu  = !!e.target.closest(MENU_SCOPE_SEL + ', nav, aside, div');
      const insideHead  = !!e.target.closest('.header');
      if (!insideMenu && !insideHead) forceMenuClosed(menu, overlay);
    });
  }

  // -------------------------
  // Slide-menu dropdowns (hide only toggle-controlled panels)
  // -------------------------
  function nearestMenuScope(fromEl) {
    return fromEl.closest?.(MENU_SCOPE_SEL + ', nav, aside, div') || null;
  }
  function findPanelForToggle(btn, scope) {
    // 1) aria-controls
    const ac = btn.getAttribute && btn.getAttribute('aria-controls');
    if (ac) { const el = scope.querySelector(`#${CSS.escape(ac)}`) || document.getElementById(ac); if (el) return el; }
    // 2) data-target
    const dt = btn.getAttribute && btn.getAttribute('data-target');
    if (dt) { try { const el = scope.querySelector(dt); if (el) return el; } catch(_){} }
    // 3) next sibling
    const next = btn.nextElementSibling;
    if (next && next.matches?.(PANEL_SEL)) return next;
    // 4) holders
    const holders = [ btn.closest('.has-submenu'), btn.closest('li'), btn.parentElement ].filter(Boolean);
    for (const h of holders) {
      const el = h.querySelector(PANEL_SEL) || h.querySelector('ul[role="group"],div[role="group"]');
      if (el) return el;
    }
    return null;
  }
  function hidePanel(panel) {
    panel.classList.remove('open','is-open');
    panel.style.maxHeight = '0px';
    panel.style.display = 'none';
    panel.hidden = true;
  }
  function showPanel(panel) {
    panel.hidden = false;
    panel.style.display = 'block';
    panel.classList.add('open','is-open');
    panel.style.maxHeight = panel.scrollHeight + 'px';
  }

  function hideOnlyTogglePanels() {
    const scope = detectMenuScope();
    if (!scope) return;
    // หาเฉพาะ panels ที่เข้าถึงได้จาก toggle เท่านั้น
    const toggles = qsa(TOGGLE_SEL, scope);
    const seen = new Set();
    toggles.forEach(tg => {
      const p = findPanelForToggle(tg, scope);
      if (p && !seen.has(p)) { hidePanel(p); seen.add(p); }
    });
    // ปล่อยกลุ่มเมนูหลักให้มองเห็นตามปกติ
  }

  function bindMobileNavDropdowns() {
    hideOnlyTogglePanels();

    document.addEventListener('click', (e) => {
      const scopeEl = nearestMenuScope(e.target);
      if (!scopeEl || !scopeEl.classList.contains('open')) return;

      let btn = e.target.closest(TOGGLE_SEL);
      if (!btn) return;

      // ถ้าเป็นไอคอน Material → รับเฉพาะ arrow/dropdown
      if (btn.classList.contains('material-symbols-outlined') || btn.classList.contains('material-icons')) {
        const txt = (btn.textContent || '').trim();
        const isArrow = (txt === 'arrow_drop_down' || txt === 'expand_more' || txt === 'chevron_right' || txt === 'chevron_left');
        if (!isArrow) return;
      }

      // ถ้าเป็นลิงก์จริง ไม่ได้ตั้งใจให้ toggle ก็ปล่อยไป
      const tag = btn.tagName.toLowerCase();
      const href = btn.getAttribute('href');
      const isRealLink = (tag === 'a' && href && href !== '#' &&
        !btn.hasAttribute('data-nav-toggle') && !btn.hasAttribute('aria-controls') && !btn.hasAttribute('data-target'));
      if (isRealLink) return;

      e.preventDefault(); e.stopPropagation();

      const panel = findPanelForToggle(btn, scopeEl);
      if (!panel) return;

      const willOpen = !panel.classList.contains('is-open');
      // accordion: ปิดอันอื่นที่เป็น panel จาก toggle เช่นกัน
      const toggles = qsa(TOGGLE_SEL, scopeEl);
      const controlled = new Set();
      toggles.forEach(t => { const p = findPanelForToggle(t, scopeEl); if (p) controlled.add(p); });
      controlled.forEach(p => { if (p !== panel) hidePanel(p); });

      if (willOpen) showPanel(panel); else hidePanel(panel);
    });

    window.addEventListener('resize', () => {
      const scope2 = detectMenuScope();
      if (!scope2) return;
      qsa(`${PANEL_SEL}.is-open`, scope2).forEach(opened => {
        opened.style.maxHeight = opened.scrollHeight + 'px';
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
    injectHelpersCSS();          // helpers
    bindSideMenu();              // 3-bars open/close
    bindMobileNavDropdowns();    // dropdowns in slide menu (hide only toggle-panels)
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