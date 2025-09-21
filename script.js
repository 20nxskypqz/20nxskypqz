/* js-21092025-01 */

/* ================= THEME ================= */
var FI_DAY_HREF='https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-chubby/css/uicons-solid-chubby.css';
var FI_NIGHT_HREF='https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-rounded/css/uicons-solid-rounded.css';
function applyIconTheme(isDark){
  try{
    var link=document.getElementById('fi-theme');
    if(link) link.setAttribute('href', isDark?FI_NIGHT_HREF:FI_DAY_HREF);
    var icon=document.getElementById('mode-icon');
    if(icon) icon.className=isDark?'fi fi-sr-moon':'fi fi-sc-sun';
  }catch(e){}
}
function toggleMode(){
  try{
    var isDark=document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    var c=document.querySelector('.toggle-circle');
    if(c){ if(isDark) c.classList.remove('light'); else c.classList.add('light'); }
    applyIconTheme(isDark);
  }catch(e){}
}

/* ================= HOME CLOCK ================= */
function updateTime(){ try{
  var d=document.getElementById('date-display');
  var t=document.getElementById('time-display');
  if(!d||!t) return;
  var now=new Date();
  d.textContent='Date: '+now.toLocaleDateString('en-GB');
  t.textContent='Time: '+now.toLocaleTimeString('en-GB');
} catch(e){} }
function updateCountdown(){ try{
  var el=document.getElementById('countdown-display'); if(!el) return;
  var target=new Date('January 1, 2026 00:00:00'); var now=new Date(); var diff=target-now;
  if(diff<=0){ el.textContent='🎉 Happy New Year 2026!'; return; }
  var days=Math.floor(diff/86400000);
  var hours=Math.floor((diff/3600000)%24);
  var minutes=Math.floor((diff/60000)%60);
  var seconds=Math.floor((diff/1000)%60);
  el.textContent=days+' days '+hours+' hours '+minutes+' minutes '+seconds+' seconds';
} catch(e){} }
function initializeUpdates(){ updateTime(); updateCountdown(); setInterval(updateTime,1000); setInterval(updateCountdown,1000); }

/* ================= SEASON PICKER (UI เท่านั้น) ================= */
var SEASONS=[{label:'Detective Conan SS.1', gid:'0'}];
function setupSeasonPicker(){
  var picker=document.getElementById('season-picker'); if(!picker) return;
  var btn=picker.querySelector('.season-button');
  var menu=picker.querySelector('.season-menu');
  var label=picker.querySelector('.season-label');

  menu.innerHTML='';
  for(var i=0;i<SEASONS.length;i++){
    (function(s){
      var li=document.createElement('li');
      li.textContent=s.label; li.setAttribute('role','option'); li.tabIndex=0;
      li.addEventListener('click', function(){
        label.textContent=s.label;
        menu.hidden=true; btn.setAttribute('aria-expanded','false');
      });
      menu.appendChild(li);
    })(SEASONS[i]);
  }

  btn.addEventListener('click', function(){
    var expanded=btn.getAttribute('aria-expanded')==='true';
    btn.setAttribute('aria-expanded', String(!expanded));
    menu.hidden=expanded;
  });
  document.addEventListener('click', function(e){
    if(!picker.contains(e.target)){ menu.hidden=true; btn.setAttribute('aria-expanded','false'); }
  });
}

/* ================= MENU & INIT ================= */
document.addEventListener('DOMContentLoaded', function(){
  try{
    // Menu
    var menuToggle=document.querySelector('.menu-toggle');
    var sideMenu=document.querySelector('.side-menu');
    var closeMenu=document.querySelector('.close-menu');
    var overlay=document.querySelector('.menu-overlay');

    function updateMenuIcon(isOpen){
      if(!menuToggle) return;
      var icon=menuToggle.querySelector('i');
      if(icon) icon.className=isOpen?'fi fi-br-cross':'fi fi-br-menu-burger';
      else menuToggle.textContent=isOpen?'×':'☰';
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    }
    function toggleMenu(){
      if(!sideMenu||!menuToggle||!overlay) return;
      var isOpen=sideMenu.classList.toggle('open');
      overlay.classList.toggle('visible', isOpen);
      sideMenu.setAttribute('aria-hidden', String(!isOpen));
    }
    if(menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if(closeMenu)  closeMenu.addEventListener('click', toggleMenu);
    if(overlay)    overlay.addEventListener('click', toggleMenu);
    updateMenuIcon(false);

    // Theme
    var modeToggle=document.getElementById('mode-toggle');
    if(modeToggle) modeToggle.addEventListener('click', toggleMode);
    applyIconTheme(document.body.classList.contains('dark-mode'));

    // Home timers
    initializeUpdates();

    // Conan: SS UI only
    setupSeasonPicker();
  }catch(e){}
});