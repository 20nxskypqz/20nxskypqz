/* js-Home-21092025-03 */

/* Theme icons swap */
var FI_DAY_HREF='https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-chubby/css/uicons-solid-chubby.css';
var FI_NIGHT_HREF='https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-rounded/css/uicons-solid-rounded.css';
function applyIconTheme(isDark){
  var link=document.getElementById('fi-theme');
  if(link) link.setAttribute('href', isDark?FI_NIGHT_HREF:FI_DAY_HREF);
  var icon=document.getElementById('mode-icon');
  if(icon) icon.className=isDark?'fi fi-sr-moon':'fi fi-sc-sun';
}
function toggleMode(){
  var isDark=document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode', !isDark);
  var c=document.querySelector('.toggle-circle');
  if(c){ if(isDark) c.classList.remove('light'); else c.classList.add('light'); }
  applyIconTheme(isDark);
}

/* Side menu: open/close + accordion */
function setupAccordionMenu(){
  document.querySelectorAll('.menu-section-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      var list = btn.nextElementSibling;
      if(list && list.classList.contains('menu-sublist')){
        list.hidden = expanded;
      }
    });
  });
}

/* Current Time in Thailand */
function updateTimeTH(){
  var d=document.getElementById('date-display');
  var t=document.getElementById('time-display');
  if(!d||!t) return;
  var opts={ timeZone:'Asia/Bangkok' };
  d.textContent = new Date().toLocaleDateString('en-GB', opts);
  t.textContent = new Date().toLocaleTimeString('en-GB', opts);
}

/* New Year 2026 countdown (TH time) */
function updateCountdownNY(){
  var el=document.getElementById('countdown-display'); if(!el) return;
  var target=new Date('2026-01-01T00:00:00+07:00'); // midnight Thailand
  var now   =new Date();
  var diff= target.getTime() - now.getTime();
  if(diff<=0){ el.textContent='🎉 Happy New Year 2026!'; return; }
  var days=Math.floor(diff/86400000);
  var hours=Math.floor((diff/3600000)%24);
  var minutes=Math.floor((diff/60000)%60);
  var seconds=Math.floor((diff/1000)%60);
  el.textContent = days+' days '+hours+' hours '+minutes+' minutes '+seconds+' seconds';
}

document.addEventListener('DOMContentLoaded', function(){
  // Menu open/close
  var menuToggle=document.querySelector('.menu-toggle');
  var sideMenu=document.querySelector('.side-menu');
  var closeMenu=document.querySelector('.close-menu');
  var overlay=document.querySelector('.menu-overlay');

  function updateMenuIcon(isOpen){
    var icon=menuToggle && menuToggle.querySelector('i');
    if(icon) icon.className=isOpen?'fi fi-br-cross':'fi fi-br-menu-burger';
    menuToggle && menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle && menuToggle.setAttribute('aria-label', isOpen?'Close navigation':'Toggle navigation');
  }
  function toggleMenu(){
    var isOpen=sideMenu.classList.toggle('open');
    overlay.classList.toggle('visible', isOpen);
    updateMenuIcon(isOpen);
    sideMenu.setAttribute('aria-hidden', String(!isOpen));
  }
  menuToggle && menuToggle.addEventListener('click', toggleMenu);
  closeMenu && closeMenu.addEventListener('click', toggleMenu);
  overlay   && overlay.addEventListener('click', toggleMenu);
  updateMenuIcon(false);

  // Theme
  var modeToggle=document.getElementById('mode-toggle');
  modeToggle && modeToggle.addEventListener('click', toggleMode);
  applyIconTheme(document.body.classList.contains('dark-mode'));

  // Accordion & Home timers
  setupAccordionMenu();
  updateTimeTH(); updateCountdownNY();
  setInterval(updateTimeTH,1000);
  setInterval(updateCountdownNY,1000);
});