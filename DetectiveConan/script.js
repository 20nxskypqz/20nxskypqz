/* js-DetectiveConan-21092025-03 */

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

/* Season Picker (UI only) */
function setupSeasonPicker(){
  var picker=document.getElementById('season-picker'); if(!picker) return;
  var btn=picker.querySelector('.season-button');
  var menu=picker.querySelector('.season-menu');
  var label=picker.querySelector('.season-label');
  if(!btn || !menu || !label) return;

  if(menu.children.length===0){
    var li=document.createElement('li');
    li.textContent='Detective Conan SS.1';
    li.setAttribute('role','option'); li.tabIndex=0;
    li.addEventListener('click', function(){
      label.textContent='Detective Conan SS.1';
      menu.hidden=true; btn.setAttribute('aria-expanded','false');
    });
    menu.appendChild(li);
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

  // Theme + Accordion + Conan UI
  var modeToggle=document.getElementById('mode-toggle');
  modeToggle && modeToggle.addEventListener('click', toggleMode);
  applyIconTheme(document.body.classList.contains('dark-mode'));

  setupAccordionMenu();
  setupSeasonPicker();
});