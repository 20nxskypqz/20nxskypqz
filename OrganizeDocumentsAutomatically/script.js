// js-OrganizeDocumentsAutomatically-30092025-01

/**********************
 * NAV & THEME TOGGLES
 **********************/
const sideMenu = document.querySelector('.side-menu');
const menuToggleBtn = document.querySelector('.menu-toggle');
const closeMenuBtn = document.querySelector('.close-menu');
const menuOverlay = document.querySelector('.menu-overlay');
const sectionToggles = document.querySelectorAll('.menu-section-toggle');

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

// Theme toggle (Material Symbols)
const modeToggle = document.getElementById('mode-toggle');
const modeIcon = document.getElementById('mode-icon');
if (modeToggle && modeIcon) {
  modeToggle.addEventListener('click', ()=>{
    document.body.classList.toggle('dark-mode');
    modeIcon.textContent = document.body.classList.contains('dark-mode') ? 'dark_mode' : 'light_mode';
  });
}

/**********************
 * EDITOR & EXPORT (คงตามเวอร์ชันที่ใช้อยู่ล่าสุด)
 **********************/
const addBtn = document.getElementById('add-btn');
const addMenu = document.getElementById('add-menu');
const editor = document.getElementById('editor');
const placeholder = document.getElementById('placeholder');
const downloadDocxBtn = document.getElementById('download-docx-btn');
const downloadPdfBtn = document.getElementById('download-pdf-btn');

const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');

let draggedItem = null;

function showLoader(text='กำลังประมวลผล...'){ if(loader){ loaderText.textContent=text; loader.style.display='flex'; } }
function hideLoader(){ if(loader){ loader.style.display='none'; } }

if(addBtn && addMenu){
  addBtn.addEventListener('click', e=>{ e.stopPropagation(); addMenu.hidden = !addMenu.hidden; });
  window.addEventListener('click', ()=>{ if(!addMenu.hidden) addMenu.hidden = true; });
  document.querySelectorAll('.add-block-option').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      addBlock(a.getAttribute('data-type'));
      addMenu.hidden = true;
    });
  });
}

function checkEditorEmpty(){ if(editor && placeholder && editor.querySelectorAll('.content-block').length===0){ placeholder.style.display='block'; } }

function addBlock(type){
  if(!editor) return;
  if(placeholder) placeholder.style.display='none';

  const block=document.createElement('div');
  block.className='content-block group relative flex items-start p-2 my-2 border border-transparent hover:border-gray-200 rounded-lg';
  block.setAttribute('draggable','true');

  const handle=document.createElement('div');
  handle.className='drag-handle cursor-move text-gray-400 opacity-0 group-hover:opacity-100 mr-3 pt-1 transition-opacity';
  handle.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>`;
  block.appendChild(handle);

  let content, placeholderText='';
  if(type==='h-center'){ content=document.createElement('h3'); content.className='ed-h3c'; placeholderText='ใส่หัวเรื่อง...'; }
  else if(type==='h1'){ content=document.createElement('h1'); content.className='ed-h1'; placeholderText='ใส่หัวข้อหลัก...'; }
  else if(type==='h2'){ content=document.createElement('h2'); content.className='ed-h2'; placeholderText='ใส่หัวข้อย่อย...'; }
  else if(type==='h4'){ content=document.createElement('h4'); content.className='ed-h4'; placeholderText='ใส่หัวข้อย่อยของย่อย...'; }
  else { content=document.createElement('p'); content.className='ed-p'; placeholderText='ใส่เนื้อหา...'; }

  content.setAttribute('contenteditable','true');
  content.setAttribute('placeholder', placeholderText);
  block.appendChild(content);

  const del=document.createElement('button');
  del.className='delete-btn';
  del.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  del.onclick=()=>{ block.remove(); checkEditorEmpty(); };
  block.appendChild(del);

  editor.appendChild(block);
  addDragEvents(block);
  content.focus();
}

function addDragEvents(item){
  item.addEventListener('dragstart', ()=>{ draggedItem=item; setTimeout(()=>item.classList.add('dragging'),0); });
  item.addEventListener('dragend', ()=>{ setTimeout(()=>{ if(draggedItem) draggedItem.classList.remove('dragging'); draggedItem=null; },0); });
}
if(editor){
  editor.addEventListener('dragover', e=>{
    e.preventDefault();
    const afterElement=getDragAfterElement(editor, e.clientY);
    const currentDragging=document.querySelector('.dragging');
    if(!currentDragging) return;
    if(afterElement==null) editor.appendChild(currentDragging); else editor.insertBefore(currentDragging, afterElement);
  });
}
function getDragAfterElement(container, y){
  const els=[...container.querySelectorAll('.content-block:not(.dragging)')];
  return els.reduce((closest, child)=>{
    const box=child.getBoundingClientRect();
    const offset=y - box.top - box.height/2;
    if(offset<0 && offset>closest.offset) return {offset, element:child};
    return closest;
  }, {offset:Number.NEGATIVE_INFINITY}).element;
}

/********** EXPORT HELPERS (ตามเวอร์ชันก่อนหน้า) **********/
function getStyledHTMLNode(){
  const clone=editor.cloneNode(true);
  clone.querySelectorAll('.drag-handle, .delete-btn, #placeholder').forEach(el=>el.remove());
  clone.querySelectorAll('[contenteditable]').forEach(el=>{
    el.removeAttribute('contenteditable'); el.removeAttribute('placeholder');
    const tag=el.tagName.toLowerCase();
    el.style.fontFamily="Niramit, Sarabun, sans-serif"; el.style.color="#000";
    if(tag==='h3'){ el.style.fontSize="26px"; el.style.fontWeight="700"; el.style.textAlign="center"; el.style.margin="1.5em 0"; }
    else if(tag==='h1'){ el.style.fontSize="26px"; el.style.fontWeight="700"; el.style.margin="1.2em 0 .4em 0"; }
    else if(tag==='h2'){ el.style.fontSize="22px"; el.style.fontWeight="700"; el.style.margin="1em 0 .4em 0"; }
    else if(tag==='h4'){ el.style.fontSize="17px"; el.style.fontWeight="700"; el.style.margin=".8em 0 .4em 0"; }
    else if(tag==='p'){ el.style.fontSize="15px"; el.style.lineHeight="1.6"; el.style.margin="0 0 .8em 0"; }
  });
  clone.querySelectorAll('.content-block').forEach(el=>el.removeAttribute('class'));
  const wrapper=document.createElement('div'); wrapper.style.background="#fff"; wrapper.style.color="#000"; wrapper.appendChild(clone);
  return wrapper;
}

// DOCX
async function exportDOCX(){
  showLoader('กำลังสร้างไฟล์ DOCX...');
  try{
    const node=getStyledHTMLNode();
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${node.innerHTML}</body></html>`;
    const blob=window.htmlDocx.asBlob(html);
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='document.docx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
  }catch(e){ console.error('DOCX error:',e); alert('เกิดข้อผิดพลาดในการสร้างไฟล์ DOCX'); }
  finally{ hideLoader(); }
}

// PDF (ข้อความจริง + margin 1cm)
async function exportPDF(){
  showLoader('กำลังสร้างไฟล์ PDF...');
  try{
    const { jsPDF } = window.jspdf;
    const pdf=new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
    const node=getStyledHTMLNode();
    await pdf.html(node, { x:10, y:10, margin:[10,10,10,10], autoPaging:'text', html2canvas:{scale:1}, callback(doc){ doc.save('document.pdf'); } });
  }catch(e){ console.error('PDF error:',e); alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF'); }
  finally{ hideLoader(); }
}

const downloadDocxBtn=document.getElementById('download-docx-btn');
const downloadPdfBtn=document.getElementById('download-pdf-btn');
if(downloadDocxBtn) downloadDocxBtn.addEventListener('click', exportDOCX);
if(downloadPdfBtn) downloadPdfBtn.addEventListener('click', exportPDF);