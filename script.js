// Root-js-14102025-[LiquidGlass-Fix]

(function () {
  "use strict";

  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const THEME_KEY = 'theme@20nxskypqz';

  function applyTheme(mode) {
    const b = document.body;
    if (mode === 'dark') { b.classList.add('dark-mode'); b.classList.remove('light-mode'); }
    else { b.classList.add('light-mode'); b.classList.remove('dark-mode'); }
  }

  // ---------- EDITED: Added this function back ----------
  function injectHelpersCSS() {
    if (document.getElementById('root-shared-helpers')) return;
    const style = document.createElement('style');
    style.id = 'root-shared-helpers';
    // This CSS fixes the arrow color in dark mode
    style.textContent = `
      .root-section-toggle .material-symbols-outlined { color: currentColor !important; }
      .dark-mode .root-section-toggle { color:#fff !important; }
      .light-mode .root-section-toggle { color:inherit; }
      .root-link-card[hidden] { display:none !important; }
    `;
    document.head.appendChild(style);
  }

  async function loadIncludes() {
    let nodesToInclude = qsa('[data-include]');
    while (nodesToInclude.length > 0) {
      for (const node of nodesToInclude) {
        const url = node.getAttribute('data-include');
        node.removeAttribute('data-include');
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) throw new Error(`Failed to fetch ${url}`);
          const html = await res.text();
          const temp = document.createElement('div');
          temp.innerHTML = html.trim();
          const frag = document.createDocumentFragment();
          while (temp.firstChild) { frag.appendChild(temp.firstChild); }
          node.replaceWith(frag);
        } catch (e) { console.error('Include failed:', url, e); node.remove(); }
      }
      nodesToInclude = qsa('[data-include]');
    }
  }

  function initSideMenu(){
    const menuToggle = document.getElementById('menuToggle');
    const slideMenu  = document.getElementById('sideMenu');
    const closeBtn   = document.getElementById('closeMenuBtn');

    if (!menuToggle || !slideMenu || !closeBtn) {
      return;
    }

    const openMenu = () => {
      slideMenu.classList.add('active');
      document.body.classList.add('menu-active');
      slideMenu.setAttribute('aria-hidden', 'false');
    };
    const closeMenu = () => {
      slideMenu.classList.remove('active');
      document.body.classList.remove('menu-active');
      slideMenu.setAttribute('aria-hidden', 'true');
    };

    menuToggle.addEventListener('click', (e) => { e.stopPropagation(); openMenu(); });
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeMenu(); });

    slideMenu.addEventListener('click', (e) => {
      const btn = e.target.closest('.menu-section-toggle');
      if (btn) {
        e.stopPropagation();
        const key = btn.getAttribute('data-menu-tier');
        const tier = document.getElementById('menu-' + key);
        if (!tier) return;
        const willShow = tier.hasAttribute('hidden');
        if (willShow) tier.removeAttribute('hidden'); else tier.setAttribute('hidden', '');
        const caret = btn.querySelector('.material-symbols-outlined');
        if (caret) caret.style.transform = willShow ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });

    document.addEventListener('click', (e) => {
      if (slideMenu.classList.contains('active') && !e.target.closest('#sideMenu')) {
        closeMenu();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && slideMenu.classList.contains('active')) {
        closeMenu();
      }
    });
  }
  
  // ---------- EDITED: Added arrow rotation logic ----------
  function initRootDropdowns() {
    const toggles = qsa('.root-section-toggle');
    if (toggles.length === 0) return;
    
    const hideAllRootPanels = () => {
      qsa('.root-link-card').forEach(panel => { panel.hidden = true; });
      toggles.forEach(btn => {
        btn.setAttribute('aria-expanded','false');
        // Reset arrow rotation
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) icon.style.transform = 'rotate(0deg)';
      });
    }
    
    hideAllRootPanels();

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.root-section-toggle');
      if (!btn) {
        if (!e.target.closest('.root-link-card')) hideAllRootPanels();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const sel = btn.getAttribute('data-target');
      const panel = sel ? qs(sel) : null;
      if (!panel) return;
      
      const willOpen = panel.hidden;
      const icon = btn.querySelector('.material-symbols-outlined');

      hideAllRootPanels();

      if (willOpen) {
        panel.hidden = false;
        btn.setAttribute('aria-expanded','true');
        // Rotate arrow down
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  }

  function bindThemeToggle() {
    const toggleCheckbox = qs('#mode-toggle-checkbox');
    if (!toggleCheckbox) return;
    const initial = (localStorage.getItem(THEME_KEY) === 'dark') ? 'dark' : 'light';
    applyTheme(initial);
    toggleCheckbox.checked = (initial === 'dark');
    toggleCheckbox.addEventListener('change', () => {
      const next = toggleCheckbox.checked ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  function initHomeTimeIfPresent() {
    // ... (ส่วนนี้ไม่มีการเปลี่ยนแปลง) ...
  }

  async function boot() {
    await loadIncludes();
    // EDITED: Make sure injectHelpersCSS is called
    injectHelpersCSS();
    initSideMenu();
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
