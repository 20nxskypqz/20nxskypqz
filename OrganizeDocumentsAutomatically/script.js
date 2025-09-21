/* js-Organize-documents-automatically-21092025-01 */

/* ===== Theme (icon swap) ===== */
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

/* ===== Side menu open/close + accordion ===== */
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

document.addEventListener('DOMContentLoaded', function(){
  // Menu
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

  // Accordion
  setupAccordionMenu();

  // Editor init
  initEditor();
});

/* ======== Editor logic ======== */
const $ = (id) => document.getElementById(id);
const addBtn = () => $('add-btn');
const addMenu = () => $('add-menu');
const editor  = () => $('editor');
const placeholder = () => $('placeholder');
const downloadDocxBtn = () => $('download-docx-btn');
const downloadPdfBtn  = () => $('download-pdf-btn');
const loader = () => $('loader');
const loaderText = () => $('loader-text');

let draggedItem = null;

function showLoader(text){ loaderText().textContent = text || 'กำลังประมวลผล...'; loader().style.display='flex'; }
function hideLoader(){ loader().style.display='none'; }

function initEditor(){
  // Menu Management
  addBtn().addEventListener('click', function(e){
    e.stopPropagation();
    var m=addMenu();
    m.style.display = (m.style.display==='block' ? 'none' : 'block');
  });
  window.addEventListener('click', function(){
    var m=addMenu(); if(m.style.display==='block') m.style.display='none';
  });
  document.querySelectorAll('.add-block-option').forEach(function(item){
    item.addEventListener('click', function(e){
      e.preventDefault();
      var type = item.getAttribute('data-type');
      addBlock(type);
      addMenu().style.display='none';
    });
  });

  // Downloads
  downloadDocxBtn().addEventListener('click', handleDownloadDocx);
  downloadPdfBtn().addEventListener('click', handleDownloadPdf);

  // Drag-over container
  editor().addEventListener('dragover', function(e){
    e.preventDefault();
    var after=getDragAfterElement(editor(), e.clientY);
    var current=document.querySelector('.dragging');
    if(!current) return;
    if(after==null){ editor().appendChild(current); } else { editor().insertBefore(current, after); }
  });
}

function addBlock(type){
  if(placeholder()) placeholder().style.display='none';

  var block=document.createElement('div');
  block.className='content-block';
  block.setAttribute('draggable','true');

  var handle=document.createElement('div');
  handle.className='drag-handle';
  handle.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>';
  block.appendChild(handle);

  var content, placeholderText='';
  if(type==='h-center'){ content=document.createElement('h3'); content.className='ed-h3c'; placeholderText='ใส่หัวเรื่อง...'; }
  else if(type==='h1'){  content=document.createElement('h1'); content.className='ed-h1';  placeholderText='ใส่หัวข้อหลัก...'; }
  else if(type==='h2'){  content=document.createElement('h2'); content.className='ed-h2';  placeholderText='ใส่หัวข้อย่อย...'; }
  else if(type==='h4'){  content=document.createElement('h4'); content.className='ed-h4';  placeholderText='ใส่หัวข้อย่อยของย่อย...'; }
  else {                 content=document.createElement('p');  content.className='ed-p';   placeholderText='ใส่เนื้อหา...'; }

  content.setAttribute('contenteditable','true');
  content.setAttribute('placeholder', placeholderText);
  block.appendChild(content);

  var del=document.createElement('button');
  del.className='delete-btn';
  del.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  del.onclick=function(){ block.remove(); checkEditorEmpty(); };
  block.appendChild(del);

  editor().appendChild(block);
  addDragEvents(block);
  content.focus();
}

/* Drag & Drop */
function addDragEvents(item){
  item.addEventListener('dragstart', function(){ draggedItem=item; setTimeout(function(){ item.classList.add('dragging'); },0); });
  item.addEventListener('dragend',   function(){ setTimeout(function(){ if(draggedItem){ draggedItem.classList.remove('dragging'); } draggedItem=null; },0); });
}
function getDragAfterElement(container, y){
  var els=[...container.querySelectorAll('.content-block:not(.dragging)')];
  return els.reduce(function(closest, child){
    var box=child.getBoundingClientRect();
    var offset=y - box.top - box.height/2;
    if(offset<0 && offset>closest.offset){ return {offset:offset, element:child}; }
    else{ return closest; }
  }, {offset:Number.NEGATIVE_INFINITY}).element;
}

function checkEditorEmpty(){
  if(editor().querySelectorAll('.content-block').length===0){ placeholder().style.display='block'; }
}

/* Export helpers (ใช้ฟอนต์ Niramit) */
function getStyledHTMLContent(){
  var ed=editor();
  var clone=ed.cloneNode(true);
  // remove controls
  clone.querySelectorAll('.drag-handle, .delete-btn, #placeholder').forEach(function(el){ el.remove(); });
  // apply export inline styles & remove contenteditable
  clone.querySelectorAll('[contenteditable]').forEach(function(el){
    el.removeAttribute('contenteditable'); el.removeAttribute('placeholder'); el.className='';
    var tag=el.tagName.toLowerCase(); var style="font-family:Niramit, sans-serif;";
    if(tag==='h3'){ style+='font-size:28px;font-weight:700;text-align:center;margin:1.5em 0;'; }
    else if(tag==='h1'){ style+='font-size:28px;font-weight:700;margin:1.5em 0 .5em;'; }
    else if(tag==='h2'){ style+='font-size:24px;font-weight:700;margin:1.2em 0 .5em;'; }
    else if(tag==='h4'){ style+='font-size:18px;font-weight:700;margin:1em 0 .5em;'; }
    else { style+='font-size:16px;line-height:1.6;margin-bottom:1em;'; }
    el.setAttribute('style', style);
  });
  clone.querySelectorAll('.content-block').forEach(function(el){ el.removeAttribute('class'); });
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Niramit,sans-serif;}</style></head><body>'+clone.innerHTML+'</body></html>';
}

async function handleDownloadDocx(){
  showLoader('กำลังสร้างไฟล์ DOCX...');
  try{
    var html=getStyledHTMLContent();
    var blob=await htmlToDocx.asBlob(html);
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='document.docx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }catch(err){
    console.error('DOCX error:', err); alert('เกิดข้อผิดพลาดในการสร้างไฟล์ DOCX');
  }finally{ hideLoader(); }
}

function handleDownloadPdf(){
  showLoader('กำลังสร้างไฟล์ PDF...');
  var { jsPDF }=window.jspdf;
  var holder=document.createElement('div');
  holder.style.position='absolute'; holder.style.left='-9999px'; holder.style.width='794px'; // A4 width @96DPI
  holder.innerHTML=getStyledHTMLContent();
  document.body.appendChild(holder);

  html2canvas(holder, { scale:2, useCORS:true }).then(function(canvas){
    var pdf=new jsPDF({ orientation:'portrait', unit:'px', format:'a4' });
    var pdfW=pdf.internal.pageSize.getWidth();
    var pdfH=pdf.internal.pageSize.getHeight();
    var ratio=canvas.width/pdfW;
    var projH=canvas.height/ratio;
    var img=canvas.toDataURL('image/png');

    var pos=0, left=projH - pdfH;
    pdf.addImage(img,'PNG',0,pos,pdfW,projH);
    while(left>0){
      pos-=pdfH; pdf.addPage(); pdf.addImage(img,'PNG',0,pos,pdfW,projH); left-=pdfH;
    }
    pdf.save('document.pdf');
  }).catch(function(err){
    console.error('PDF error:', err); alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
  }).finally(function(){
    document.body.removeChild(holder); hideLoader();
  });
}