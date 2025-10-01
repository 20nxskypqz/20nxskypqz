/* js-RootShared-01102025-08
   ✅ แก้ปุ่ม 3 ขีด/สลับโหมดใช้ไม่ได้ ด้วย Event Delegation + ผูกหลัง include
   ✅ dropdown หน้า Root: กดได้, ซ่อนการ์ดไว้ก่อน, โชว์เมื่อกดเท่านั้น
   ✅ สีไอคอน dropdown เปลี่ยนตามโหมด (รับมรดกสีตัวอักษร)
*/

(function () {
  "use strict";

  // ---------- Utils ----------
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // อ่านค่า theme
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

    // ใส่ aria/cursor ให้ปุ่ม (ถ้ามี)
    qsa('.root-section-toggle').forEach(btn=>{
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-expanded', 'false');
      if(!btn.hasAttribute('aria-label')) btn.setAttribute('aria-label', 'Toggle section');
      btn.style.cursor = 'pointer';
    });
  }

  // ---------- Side menu helpers ----------
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

  // ---------- Event Delegation (คลิกรวมทั้งหน้า) ----------
  function bindGlobalClicks() {
    document.addEventListener('click', (e) => {
      const t = e.target;

      // 1) เปิดเมนู (3 ขีด) — รองรับหลาย selector
      const openTrigger = t.closest('.menu-button, [data-open-menu], [data-menu-open], .hamburger, .header .menu-button');
      if (openTrigger) {
        e.preventDefault(); e.stopPropagation();
        openMenu();
        return;
      }

      // 2) ปิดเมนู (กากบาท/ฉากหลัง)
      const closeTrigger = t.closest('.close-menu, [data-menu-close]');
      const overlayClick = t.closest('.menu-overlay');
      if (closeTrigger || overlayClick) {
        e.preventDefault(); e.stopPropagation();
        closeMenu();
        return;
      }

      // 3) สลับธีม (ปุ่มสลับโหมด) — รองรับหลาย selector
      const themeTrigger = t.closest('.theme-toggle, [data-theme-toggle], #themeToggle');
      if (themeTrigger) {
        e.preventDefault(); e.stopPropagation();
        const isDark = document.body.classList.contains('dark-mode');
        const next = isDark ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
        return;
      }

      // 4) Root: dropdown toggle (แสดง/ซ่อนการ์ด)
      const dropBtn = t.closest('.root-section-toggle');
      if (dropBtn) {
        e.preventDefault(); e.stopPropagation();
        const sel = dropBtn.getAttribute('data-target');
        if (!sel) return;
        const panel = qs(sel);
        if (!panel) return;

        const willOpen = panel.hidden === true || panel.style.display === 'none';
        // ปิดตัวอื่น (ถ้าต้องการให้เปิดได้ทีละอัน)
        // hideAllRootPanels();

        panel.hidden = !willOpen;
        panel.style.display = willOpen ? '' : 'none';
        dropBtn.setAttribute('aria-expanded', String(willOpen));
        return;
      }

      // 5) คลิกนอกการ์ด => ปิดการ์ดทั้งหมด (เฉพาะหน้ารูท)
      const inPanel  = t.closest('.root-link-card');
      const inToggle = t.closest('.root-section-toggle');
      if (!inPanel && !inToggle && qs('.root-link-card')) {
        hideAllRootPanels();
      }
    });

    // ปิดเมนูด้วย ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
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

  // ---------- Boot ----------
  async function boot() {
    // โหลด include ก่อน
    await loadIncludes();

    // โหลด theme จาก localStorage (ไม่ไปยุ่งอัตโนมัติช่วงเวลา)
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved === 'dark' ? 'dark' : 'light');

    // ผูกคลิกแบบ global (รองรับ element ที่เพิ่ง include มาทีหลัง)
    bindGlobalClicks();

    // เตรียม dropdown หน้า Root
    initRootDropdowns();

    // เวลา/นับถอยหลัง (เฉพาะหน้าโฮม)
    initHomeTimeIfPresent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();