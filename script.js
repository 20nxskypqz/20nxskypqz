/* js-RootShared-01102025-07
   - รวมสคริปต์ส่วนกลางทุกหน้า (โหลด include, เมนู 3 ขีด, โหมดมืด)
   - เพิ่ม logic สำหรับปุ่ม dropdown ของหน้ารูท:
       * ทำให้กดได้จริง
       * ซ่อนกล่องลิงก์ไว้ก่อนเสมอ (แสดงต่อเมื่อกด dropdown)
       * สีไอคอนเปลี่ยนอัตโนมัติเมื่อสลับโหมด (อาศัย color: inherit)
*/

(function () {
  "use strict";

  // -------------------------
  // Utilities
  // -------------------------
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

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
    const openBtn  = qs('.header .menu-button, .header [data-open-menu]');
    const closeBtn = qs('.side-menu .close-menu');
    const menu     = qs('.side-menu');
    const overlay  = qs('.menu-overlay');

    if (!menu || !overlay) return;

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

    // เปิด/ปิดด้วยปุ่ม
    if (openBtn)  openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    // ปิดเมื่อคลิกฉากหลัง
    overlay.addEventListener('click', close);

    // ปิดด้วย ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // Sub-sections ในเมนู 3 ขีด
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
    const toggle = qs('.header .theme-toggle');
    const root = document.body;
    const KEY = 'theme@20nxskypqz';

    const apply = (mode) => {
      if (mode === 'dark') {
        root.classList.add('dark-mode');
        root.classList.remove('light-mode');
      } else {
        root.classList.add('light-mode');
        root.classList.remove('dark-mode');
      }
    };

    // โหลดจาก localStorage
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light') {
      apply(saved);
    } else {
      // ค่าเริ่มต้น: light
      apply('light');
    }

    if (toggle) {
      toggle.addEventListener('click', () => {
        const isDark = root.classList.contains('dark-mode');
        const next = isDark ? 'light' : 'dark';
        apply(next);
        localStorage.setItem(KEY, next);
      });
    }
  }

  // -------------------------
  // ROOT page: dropdown sections
  //  - ซ่อนการ์ดลิงก์เสมอ (ตอนโหลดหน้า)
  //  - แสดง/ซ่อนเมื่อกดปุ่ม dropdown
  //  - ไอคอนเป็นปุ่มที่ "กดได้จริง"
  //  - สีไอคอนเปลี่ยนตามโหมด (อาศัย color:inherit จาก CSS เดิม)
  // -------------------------
  function initRootDropdowns() {
    // บังคับซ่อนทุกการ์ดในหน้า (กันกรณีมี CSS ไป override)
    qsa('.root-link-card').forEach(panel => {
      panel.hidden = true;
      panel.style.display = 'none';
    });

    // คลิกที่ไอคอน dropdown เพื่อสลับแสดง/ซ่อน
    qsa('.root-section-toggle').forEach(btn => {
      // ทำให้กดได้แน่ ๆ (cursor pointer, aria)
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

        // toggle
        const willOpen = panel.hidden === true || panel.style.display === 'none';
        panel.hidden = !willOpen;
        panel.style.display = willOpen ? '' : 'none';

        // หมุนลูกศร (ใช้ aria-expanded + CSS ถ้ามี)
        btn.setAttribute('aria-expanded', String(willOpen));
      });
    });

    // คลิกนอก panel เพื่อปิด (optional — ถ้าไม่ต้องการลบส่วนนี้ได้)
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
  // Time/Countdown (โค้ดของหน้าโฮมอาจพึ่ง DOM id เฉพาะ)
  // -------------------------
  function initHomeTimeIfPresent() {
    const timeEl = qs('#current-time');
    const cdEl   = qs('#countdown-display');
    if (!timeEl && !cdEl) return; // ไม่ใช่หน้าโฮม ก็ข้าม

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
  // Boot
  // -------------------------
  async function boot() {
    await loadIncludes();       // ใส่ header/side-menu/footer
    bindSideMenu();             // เมนู 3 ขีด
    bindThemeToggle();          // โหมดมืด/สว่าง
    initRootDropdowns();        // ปุ่ม dropdown ที่หน้ารูท
    initHomeTimeIfPresent();    // เวลา & เคานต์ดาวน์ (ถ้าเป็นหน้าโฮม)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();