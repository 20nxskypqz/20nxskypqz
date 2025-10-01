/* js-RootShared-01102025-09
   ✅ แก้ปุ่มกดไม่ได้ (3 ขีด, ปิดเมนู, สลับโหมด)
   ✅ Event Delegation รองรับทั้งปุ่ม/ไอคอน Material Symbols (menu/close/dark_mode/light_mode)
   ✅ dropdown หน้ารูท: ซ่อนก่อนเสมอ, กดไอคอนแล้วค่อยแสดง, กดที่อื่นปิด
*/

(function () {
  "use strict";

  // ---------- Utils ----------
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // อ่านชื่อไอคอน Material Symbols จาก element ที่คลิก
  function iconName(el) {
    if (!el) return null;
    const isIcon = (node) =>
      node.classList && [...node.classList].some(cls => cls.startsWith('material-symbols'));
    // ไล่ขึ้นไปหา parent ที่เป็น icon ด้วย
    const iconEl = el.closest ? el.closest('.material-symbols-outlined, .material-symbols-rounded, .material-symbols-sharp') : null;
    const node = isIcon(el) ? el : iconEl;
    if (!node) return null;
    return (node.textContent || '').trim().toLowerCase();
  }

  // ---------- Theme ----------
  const THEME_KEY = 'theme@20nxskypqz';
  const applyTheme = (mode) => {
    const b = document.body;
    if (mode === 'dark') {
      b.classList.add('dark-mode'); b.classList.remove('light-mode');
    } else {
      b.classList.add('light-mode'); b.classList.remove('dark-mode');
    }
  };

  // ---------- HTML includes ----------
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

  // ---------- Side menu ----------
  function getMenuElems() {
    const menu    = qs('.side-menu');
    const overlay = qs('.menu-overlay');
    return { menu, overlay };
  }
  function openMenu() {
    const { menu, overlay } = getMenuElems();
    if (!menu || !overlay) return;
    menu.classList.add('open');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    const { menu, overlay } = getMenuElems();
    if (!menu || !overlay) return;
    menu.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  // ---------- Root dropdown panels ----------
  function hideAllRootPanels() {
    qsa('.root-link-card').forEach(panel => {
      panel.hidden = true;
      panel.style.display = 'none';
    });
    qsa('.root-section-toggle[aria-expanded="true"]').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
  }
  function initRootDropdowns() {
    // ซ่อนก่อนเสมอ
    hideAllRootPanels();
    // ใส่ aria/cursor ให้ปุ่ม toggle
    qsa('.root-section-toggle').forEach(btn=>{
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-expanded', 'false');
      if(!btn.hasAttribute('aria-label')) btn.setAttribute('aria-label', 'Toggle section');
      btn.style.cursor = 'pointer';
    });
  }

  // ---------- Home date/time & countdown (ถ้ามี) ----------
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

  // ---------- Global Event Delegation ----------
  function bindGlobalPointer() {
    // ใช้ pointerdown ให้ติดบนมือถือ/ทัชเร็วขึ้น (และซ้ำด้วย click กันพลาด)
    const handler = (e) => {
      const t = e.target;

      // 1) เปิดเมนู (3 ขีด)
      const openBtn = t.closest('.menu-button, [data-open-menu], [data-menu-open], .hamburger, .header .menu-button, .header .hamburger');
      const isMenuIcon = t.closest('.header') && iconName(t) === 'menu';
      if (openBtn || isMenuIcon) {
        e.preventDefault(); e.stopPropagation();
        openMenu();
        return;
      }

      // 2) ปิดเมนู (กากบาท/ฉากหลัง)
      const closeBtn = t.closest('.close-menu, [data-menu-close]');
      const overlayClick = t.closest('.menu-overlay');
      const isCloseIcon = t.closest('.side-menu') && iconName(t) === 'close';
      if (closeBtn || overlayClick || isCloseIcon) {
        e.preventDefault(); e.stopPropagation();
        closeMenu();
        return;
      }

      // 3) สลับธีม (ปุ่มสลับโหมด)
      const themeBtn = t.closest('.theme-toggle, [data-theme-toggle], #themeToggle');
      const icon = iconName(t);
      const isThemeIcon = t.closest('.header') && (icon === 'dark_mode' || icon === 'light_mode');
      if (themeBtn || isThemeIcon) {
        e.preventDefault(); e.stopPropagation();
        const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
        return;
      }

      // 4) Root: dropdown toggle (ไอคอนลูกศร)
      const dropBtn = t.closest('.root-section-toggle');
      if (dropBtn) {
        e.preventDefault(); e.stopPropagation();
        const sel = dropBtn.getAttribute('data-target');
        if (!sel) return;
        const panel = qs(sel);
        if (!panel) return;

        const willOpen = panel.hidden === true || panel.style.display === 'none';
        // ถ้าอยากเปิดได้ทีละอัน ให้ uncomment บรรทัดถัดไป
        // hideAllRootPanels();

        panel.hidden = !willOpen;
        panel.style.display = willOpen ? '' : 'none';
        dropBtn.setAttribute('aria-expanded', String(willOpen));
        return;
      }

      // 5) คลิกนอก panel => ปิดการ์ดทั้งหมด (เฉพาะหน้ารูท)
      const inPanel  = t.closest('.root-link-card');
      const inToggle = t.closest('.root-section-toggle');
      if (!inPanel && !inToggle && qs('.root-link-card')) {
        hideAllRootPanels();
      }
    };

    document.addEventListener('pointerdown', handler, { passive:false });
    document.addEventListener('click', handler, { passive:false });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }

  // ---------- Boot ----------
  async function boot() {
    await loadIncludes();                           // 1) โหลดส่วนหัว/เมนู/ท้ายให้เสร็จ
    const saved = localStorage.getItem(THEME_KEY);  // 2) ใช้ธีมเดิมจาก localStorage
    applyTheme(saved === 'dark' ? 'dark' : 'light');

    initRootDropdowns();    // 3) เตรียม dropdown หน้า Root (ซ่อนก่อนเสมอ)
    bindGlobalPointer();    // 4) ผูกอีเวนต์แบบ Delegation (คลุมทั้งหน้า)
    initHomeTimeIfPresent();// 5) เวลา/เคานต์ดาวน์ (ถ้าเป็นหน้าโฮม)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();