// js-Root-30092025-04 — Global shared logic

// 1) โหลดไฟล์ shared (*.html) เข้ามาแทนที่ data-include
async function includeFragments(){
  const incs = document.querySelectorAll('[data-include]');
  for (const el of incs){
    const url = el.getAttribute('data-include');
    const res = await fetch(url, { cache: 'no-cache' });
    el.innerHTML = await res.text();
  }
}

// 2) ผูกเมนู/ธีม หลังโหลด fragments แล้ว
function wireCommonUI(){
  const sideMenu = document.querySelector('.side-menu');
  const menuToggleBtn = document.querySelector('.menu-toggle');
  const closeMenuBtn = document.querySelector('.close-menu');
  const menuOverlay = document.querySelector('.menu-overlay');
  const sectionToggles = document.querySelectorAll('.menu-section-toggle');

  const openMenu = ()=>{ sideMenu?.classList.add('open'); menuOverlay?.classList.add('visible'); };
  const closeMenu = ()=>{ sideMenu?.classList.remove('open'); menuOverlay?.classList.remove('visible'); };
  menuToggleBtn?.addEventListener('click', openMenu);
  closeMenuBtn?.addEventListener('click', closeMenu);
  menuOverlay?.addEventListener('click', closeMenu);

  sectionToggles.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const expanded = btn.getAttribute('aria-expanded')==='true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const ul = btn.nextElementSibling;
      if(!ul) return;
      if(expanded) ul.setAttribute('hidden',''); else ul.removeAttribute('hidden');
    });
  });

  // Toggle Day/Night capsule (จำสถานะด้วย localStorage)
  const modeToggle = document.getElementById('mode-toggle');
  const toggleCircle = document.querySelector('.toggle-circle');
  const saved = localStorage.getItem('theme');
  if(saved==='dark'){ document.body.classList.add('dark-mode'); if(toggleCircle) toggleCircle.textContent='Night'; }
  else { if(toggleCircle) toggleCircle.textContent='Day'; }

  modeToggle?.addEventListener('click', ()=>{
    document.body.classList.toggle('dark-mode');
    const dark = document.body.classList.contains('dark-mode');
    if(toggleCircle) toggleCircle.textContent = dark ? 'Night' : 'Day';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  });
}

// 3) บูตระบบ
document.addEventListener('DOMContentLoaded', async ()=>{
  await includeFragments();
  wireCommonUI();

  // ฟังก์ชันพิเศษของหน้า Root: dropdown card
  const dropBtn = document.getElementById('root-drop-btn');
  const dropCard = document.getElementById('root-drop-card');
  dropBtn?.addEventListener('click', ()=>{
    const hidden = dropCard.hasAttribute('hidden');
    if(hidden) dropCard.removeAttribute('hidden'); else dropCard.setAttribute('hidden','');
  });
});