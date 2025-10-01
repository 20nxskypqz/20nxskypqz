/* js-RootShared-01102025-06r
   Baseline: behavior pre-v7
   - โหลด includes ให้เสร็จก่อน แล้วค่อย bind ปุ่มแบบ “เจาะจง” (ไม่ใช้ delegation ทั้งหน้า)
   - รองรับปุ่ม/ไอคอนยอดฮิตหลายแบบ แต่ไม่มีการดักกว้างเกินไป
   - เมนู 3 ขีด, ปุ่มปิด, overlay, toggle group ในเมนู — ทำงานตรงไปตรงมา
   - โหมดมืด: .header .theme-toggle (+ เผื่อไอคอน 'dark_mode'/'light_mode' ในหัว)
   - หน้า Root: dropdown ซ่อนเสมอ โชว์เฉพาะเมื่อกดไอคอนของหัวข้อนั้น
   - หน้า Home: เวลา 24 ชม. ไม่มี comma + Countdown EN labels (Days/Hours/Minutes/Seconds)
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

    // ปุ่มเปิดเมนู: รองรับหลาย selector ที่เราเคยใช้ก่อน v7
    const openBtns = [
      ...qsa('.header .menu-button', header),
      ...qsa('.header [data-open-menu]', header),
      ...qsa('.header .hamburger', header)
    ];
    // เผื่อกรณีใช้ Material Symbols เป็นไอคอน “menu” ในหัว
    const iconMenu = qsa('.header .material-symbols-outlined', header)
      .filter(el => (el.textContent || '').trim().toLowerCase() === 'menu');
    openBtns.push(...iconMenu);

    // ปุ่มปิดเมนู (กากบาทในเมนู)
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

    // toggle กลุ่มย่อยในเมนู 3 ขีด (เฉพาะปุ่มในเมนู)
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

    // ปุ่มสลับโหมดหลัก
    const toggleBtn = qs('.header .theme-toggle', header);

    // เผื่อมีใช้ Material Symbols เป็นไอคอนสลับโหมดในหัว
    const themeIcons = qsa('.header .material-symbols-outlined', header)
      .filter(el => {
        const name = (el.textContent || '').trim().toLowerCase();
        return name === 'dark_mode' || name === 'light_mode';
      });

    // โหลดธีมจาก localStorage (ก่อน v7 ไม่มี auto-time)
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
    // ซ่อนทุกการ์ด
    qsa('.root-link-card').forEach(panel => {
      panel.hidden = true;
      panel.style.display = 'none';
    });

    // ปุ่มไอคอนลูกศรของแต่ละหัวข้อ
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

    // คลิกนอกพื้นที่ => ปิดทั้งหมด
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
  // Home date/time & countdown (ถ้ามี)
  // -------------------------
  function initHomeTimeIfPresent() {
    const timeEl = qs('#current-time');
    const cdEl   = qs('#countdown-display');
    if (!timeEl && !cdEl) return;

    const TZ = 'Asia/Bangkok';
    const pad2 = n => n.toString().padStart(2, '0');
    const fmt24 = (d) => {
      const dd = new Intl.DateTimeFormat('en-GB',{day:'2-digit', timeZone:TZ}).format(d);
      const mm = new Intl.DateTimeFormat('en-GB',{month:'2-digit', timeZone:TZ}).format(d);
      const yy = new Intl.DateTimeFormat('en-GB',{year:'numeric', timeZone:TZ}).format(d);
      const hh = new Intl.DateTimeFormat('en-GB',{hour:'2-digit', hour12:false, timeZone:TZ}).format(d);
      const mi = new Intl.DateTimeFormat('en-GB',{minute:'2-digit', timeZone:TZ}).format(d);
      const ss = new Intl.DateTimeFormat('en-GB',{second:'2-digit', timeZone:TZ}).format(d);
      return `${dd}/${mm}/${yy} ${hh}:${mi}:${ss}`;
    };

    function tick(){
      const now = new Date();
      if (timeEl) timeEl.textContent = fmt24(now);

      if (cdEl) {
        const target = new Date('2026-01-01T00:00:00+07:00').getTime();
        let diff = Math.max(0, target - now.getTime());
        const days = Math.floor(diff / 86400000); diff %= 86400000;
        const hours = Math.floor(diff / 3600000);  diff %= 3600000;
        const minutes = Math.floor(diff / 60000);  diff %= 60000;
        const seconds = Math.floor(diff / 1000);
        cdEl.textContent = `${days} Days ${pad2(hours)} Hours ${pad2(minutes)} Minutes ${pad2(seconds)} Seconds`;
        cdEl.style.textAlign = 'center';
      }
    }
    setInterval(tick, 1000); tick();
  }

  // -------------------------
  // Boot (โหลด includes เสร็จแล้วค่อย bind; ไม่มี delegation ทั้งหน้า)
  // -------------------------
  async function boot() {
    await loadIncludes();     // 1) โหลดส่วนหัว/เมนู/ท้ายให้เสร็จก่อน
    bindSideMenu();           // 2) ค่อย bind ปุ่มเมนู 3 ขีด + ปิดเมนู
    bindThemeToggle();        // 3) bind ปุ่มสลับโหมด
    initRootDropdowns();      // 4) dropdown หน้า Root (ซ่อนก่อน)
    initHomeTimeIfPresent();  // 5) เวลา/Countdown (เฉพาะหน้าโฮม)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();