/* script.js — js-RootShared-01102025-33
   - KEEP base from v22
   - FIX: mobile-nav dropdowns inside the 3-bars menu
     • Hides sublists by default
     • Toggle via .nav-section-toggle / [data-nav-toggle] / [aria-controls] / nextElementSibling
   - KEEP: includes→bind order (header/footer), theme toggle, side menu, root dropdowns, home time
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
    qsa('.theme-toggle .material-symbols-outlined').forEach(ic => ic.textContent = name);
    const modeIcon = qs('#mode-icon'); if (modeIcon) modeIcon.textContent = name;
  }

  // -------------------------
  // CSS helpers (injected)
  // -------------------------
  function injectDropdownIconDarkFix() {
    if (document.getElementById('dropdown-dark-fix')) return;
    const style = document.createElement('style');
    style.id = 'dropdown-dark-fix';
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
      /* mobile-nav dropdown basic states (hidden by default) */
      #mobile-nav .nav-sublist,[data-nav-sublist] { display:none; }
      #mobile-nav .nav-sublist.open,[data-nav-sublist].open { display:block; }
    `;
    document.head.appendChild(style);
  }

  // -------------------------
  // HTML includes (header/footer/etc.)
  // -------------------------
  async function loadIncludes() {
    const includeEls = qsa('[data-include]');
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
  // Side menu
  // -------------------------
  function ensureOverlay() {
    let ov = qs('.menu-overlay');
    if (!ov) { ov = document.createElement('div'); ov.className='menu-overlay'; document.body.appendChild(ov); }
    return ov;
  }
  function bindSideMenu() {
    const header  = qs('.header');
    const menu    = qs('#mobile-nav') || qs('.side-menu');
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
  // Mobile-nav DROPDOWNS (inside the 3-bars menu)
  // -------------------------
  function panelForToggle(btn) {
    // by aria-controls
    const ac = btn.getAttribute('aria-controls');
    if (ac) { const el = document.getElementById(ac); if (el) return el; }
    // by data-target
    const dt = btn.getAttribute('data-target');
    if (dt) { const el = qs(dt, btn.closest('#mobile-nav')||document); if (el) return el; }
    // next sibling common names
    const next = btn.nextElementSibling;
    if (next && (next.classList.contains('nav-sublist') || next.hasAttribute('data-nav-sublist') ||
                 next.classList.contains('menu-sublist') || next.classList.contains('submenu'))) {
      return next;
    }
    return null;
  }
  function closeAllMobileSubLists(root) {
    qsa('.nav-sublist,[data-nav-sublist],.menu-sublist,.submenu', root).forEach(el=>{
      el.classList.remove('open'); el.style.display='none';
    });
    qsa('.nav-section-toggle,[data-nav-toggle]', root).forEach(tg=>{
      tg.setAttribute('aria-expanded','false');
    });
  }
  function bindMobileNavDropdowns() {
    const nav = qs('#mobile-nav');
    if (!nav) return;

    // Hide all sublists initially
    closeAllMobileSubLists(nav);

    // Delegate clicks inside #mobile-nav
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-section-toggle,[data-nav-toggle]');
      if (!btn) return;
      e.preventDefault();
      const panel = panelForToggle(btn);
      if (!panel) return;

      const willOpen = !panel.classList.contains('open');
      // close others (accordion behavior)
      closeAllMobileSubLists(nav);

      if (willOpen) {
        panel.classList.add('open');
        panel.style.display = 'block';
        btn.setAttribute('aria-expanded','true');
      }
    });
  }

  // -------------------------
  // Root dropdowns (on the root page)
  // -------------------------
  function initRootDropdowns() {
    qsa('.root-link-card').forEach(panel => { panel.hidden = true; panel.style.display = 'none'; });
    qsa('.root-section-toggle').forEach(btn => {
      btn.setAttribute('type','button'); btn.setAttribute('aria-expanded','false'); btn.style.cursor='pointer';
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const sel = btn.getAttribute('data-target');
        const panel = sel ? qs(sel) : null; if (!panel) return;
        const willOpen = panel.hidden || panel.style.display === 'none';
        // close others
        qsa('.root-link-card').forEach(p => { p.hidden = true; p.style.display = 'none'; });
        qsa('.root-section-toggle[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded','false'));
        // open this one
        if (willOpen) { panel.hidden=false; panel.style.display=''; btn.setAttribute('aria-expanded','true'); }
      });
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('.root-section-toggle') || e.target.closest('.root-link-card')) return;
      qsa('.root-link-card').forEach(panel => { panel.hidden = true; panel.style.display = 'none'; });
      qsa('.root-section-toggle[aria-expanded="true"]').forEach(btn => btn.setAttribute('aria-expanded','false'));
    });
  }

  // -------------------------
  // Theme toggle (Material Symbols)
  // -------------------------
  function bindThemeToggle() {
    const initial = (localStorage.getItem(THEME_KEY) === 'dark') ? 'dark' : 'light';
    applyTheme(initial); setThemeIconAll(initial);

    function isToggle(el){
      return !!(el.closest('.theme-toggle') || el.closest('#mode-toggle') || el.closest('[data-theme-toggle]'));
    }
    document.addEventListener('click', (e) => {
      if (!isToggle(e.target)) return;
      e.preventDefault();
      const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(next); localStorage.setItem(THEME_KEY, next); setThemeIconAll(next);
    }, true);
    document.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && isToggle(e.target)) {
        e.preventDefault();
        const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(next); localStorage.setItem(THEME_KEY, next); setThemeIconAll(next);
      }
    }, true);
  }

  // -------------------------
  // Home time & countdown (no flicker)
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
      const parts = dtf.formatToParts(d).reduce((o,p)=>(o[p.type]=p.value,o),{});
      return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
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
    await loadIncludes();            // ต้องโหลดหัว/ท้ายก่อน
    injectDropdownIconDarkFix();     // styles รวม และซ่อน sublist เริ่มต้น
    bindSideMenu();                  // ปุ่มสามขีด
    bindMobileNavDropdowns();        // <-- แก้ dropdown ในเมนู 3 ขีด
    bindThemeToggle();               // โหมดสว่าง/มืด
    initRootDropdowns();             // dropdown บนหน้า root
    initHomeTimeIfPresent();         // เวลา/นับถอยหลัง
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();