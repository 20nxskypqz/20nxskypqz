/* Root-JavaScript-03102025-[Complete] */
(function(){
  const includeFragments = async () => {
    const nodes = document.querySelectorAll('[data-include]');
    for (const n of nodes) {
      const url = n.getAttribute('data-include');
      if (!url) continue;
      try {
        const res = await fetch(url);
        const html = await res.text();
        const temp = document.createElement('div');
        temp.innerHTML = html;
        while (temp.firstChild) n.parentNode.insertBefore(temp.firstChild, n);
        n.remove();
      } catch(e){ console.error('Include failed:', url, e); }
    }
  };

  const onReady = async () => {
    await includeFragments();

    // Dark mode toggle
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('mode');
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.body.classList.add('dark-mode');
    }
    const toggle = document.getElementById('mode-toggle');
    const icon = document.getElementById('mode-icon');
    const setIcon = () => {
      if (!icon) return;
      icon.textContent = document.body.classList.contains('dark-mode') ? 'dark_mode' : 'light_mode';
    };
    setIcon();
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('mode', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        setIcon();
      });
    }

    // Side-menu
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const openBtn = document.querySelector('.menu-toggle');
    const closeBtn = document.querySelector('.close-menu');

    const openMenu = () => {
      sideMenu && sideMenu.classList.add('open');
      menuOverlay && menuOverlay.classList.add('visible');
    };
    const closeMenu = () => {
      sideMenu && sideMenu.classList.remove('open');
      menuOverlay && menuOverlay.classList.remove('visible');
    };

    if (openBtn) openBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

    // Side-menu dropdowns
    document.querySelectorAll('.menu-section-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (!target) return;
        const el = document.querySelector(target);
        if (el) el.hidden = !el.hidden;
      });
    });

    // Root-page dropdowns
    document.querySelectorAll('.root-dd').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSel = btn.getAttribute('data-target');
        if (!targetSel) return;
        const target = document.querySelector(targetSel);
        if (target) target.hidden = !target.hidden;
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();