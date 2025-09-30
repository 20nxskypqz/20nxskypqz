// js-DetectiveConan-30092025-01
const sideMenu=document.querySelector('.side-menu');
const menuToggleBtn=document.querySelector('.menu-toggle');
const closeMenuBtn=document.querySelector('.close-menu');
const menuOverlay=document.querySelector('.menu-overlay');
const sectionToggles=document.querySelectorAll('.menu-section-toggle');

function openMenu(){ sideMenu.classList.add('open'); menuOverlay.classList.add('visible'); }
function closeMenu(){ sideMenu.classList.remove('open'); menuOverlay.classList.remove('visible'); }
if(menuToggleBtn) menuToggleBtn.addEventListener('click', openMenu);
if(closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
if(menuOverlay) menuOverlay.addEventListener('click', closeMenu);

sectionToggles.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const expanded = btn.getAttribute('aria-expanded')==='true';
    btn.setAttribute('aria-expanded', String(!expanded));
    const ul = btn.nextElementSibling; if(!ul) return;
    if(expanded) ul.setAttribute('hidden',''); else ul.removeAttribute('hidden');
  });
});

// Theme toggle
const modeToggle=document.getElementById('mode-toggle');
const modeIcon=document.getElementById('mode-icon');
if(modeToggle && modeIcon){
  modeToggle.addEventListener('click', ()=>{
    document.body.classList.toggle('dark-mode');
    modeIcon.textContent = document.body.classList.contains('dark-mode') ? 'dark_mode' : 'light_mode';
  });
}