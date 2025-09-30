// js-OrganizeDocumentsAutomatically-30092025-03
// (เฉพาะ logic ของ editor & export — เมนู/ธีมใช้จาก /script.js แล้ว)

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

// Menu for adding blocks
if(addBtn && addMenu){
  addBtn.addEventListener('click', e=>{ e.stopPropagation(); addMenu.hidden = !addMenu.hidden; });
  window.addEventListener('click', ()=>{ if(!addMenu.hidden) addMenu.hidden = true; });
  document.addEventListener('click', e=>{
    const a = e.target.closest('.add-block-option');
    if(!a) return;
    e.preventDefault();
    addBlock(a.getAttribute('data-type'));
    addMenu.hidden = true;
  });
}

function checkEditorEmpty(){ if(editor && placeholder && editor.querySelectorAll('.content-block').length===0){ placeholder.style.display='block'; } }
function addBlock(type){
  if(!editor) return;
  if(placeholder) placeholder.style.display='none';

  const block=document.createElement('div');
  block.className='content-block';
  block.style.cssText='position:relative; display:flex; align-items:flex-start; gap:12px; padding:8px; margin:8px 0; border:1px solid transparent; border-radius:10px;';
  block.setAttribute('draggable','true');

  const handle=document.createElement('div');
  handle.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>`;
  handle.style.cssText='cursor:move; opacity:.5; padding-top:4px;';
  block.appendChild(handle);

  let content, ph='';
  if(type==='h-center'){ content=document.createElement('h3'); content.style.cssText='width:100%; font-size:24px; font-weight:700; text-align:center; outline:none;'; ph='ใส่หัวเรื่อง...'; }
  else if(type==='h1'){ content=document.createElement('h1'); content.style.cssText='width:100%; font-size:24px; font-weight:700; outline:none;'; ph='ใส่หัวข้อหลัก...'; }
  else if(type==='h2'){ content=document.createElement('h2'); content.style.cssText='width:100%; font-size:24px; outline:none;'; ph='ใส่หัวข้อย่อย...'; }
  else if(type==='h4'){ content=document.createElement('h4'); content.style.cssText='width:100%; font-size:20px; outline:none;'; ph='ใส่หัวข้อย่อยของย่อย...'; }
  else { content=document.createElement('p'); content.style.cssText='width:100%; font-size:16px; line-height:1.6; outline:none;'; ph='ใส่เนื้อหา...'; }

  content.setAttribute('contenteditable','true');
  content.setAttribute('placeholder', ph);
  content.addEventListener('focus', ()=> block.style.borderColor='#d0d7de');
  content.addEventListener('blur', ()=> block.style.borderColor='transparent');

  block.appendChild(content);

  const del=document.createElement('button');
  del.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  del.style.cssText='position:absolute; right:-6px; top:50%; transform:translateY(-50%); width:28px; height:28px; border-radius:999px; background:#ef4444; color:#fff; display:flex; align-items:center; justify-content:center;';
  del.onclick=()=>{ block.remove(); checkEditorEmpty(); };
  block.appendChild(del);

  editor.appendChild(block);
  addDragEvents(block);
  content.focus();
}

// Drag & drop
function addDragEvents(item){
  item.addEventListener('dragstart', ()=>{ draggedItem=item; item.classList.add('dragging'); });
  item.addEventListener('dragend', ()=>{ draggedItem=null; item.classList.remove('dragging'); });
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

// Export helpers
function getStyledHTMLNode(){
  const clone=editor.cloneNode(true);
  clone.querySelectorAll('.drag-handle, .delete-btn, #placeholder').forEach(el=>el?.remove());
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
  wrapper.style.padding="10mm"; /* ~1cm margin */
  return wrapper;
}

// DOCX (text selectable)
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

// PDF (ข้อความจริง + margin 1cm; คมชัดและคัดลอกข้อความได้)
async function exportPDF(){
  showLoader('กำลังสร้างไฟล์ PDF...');
  try{
    const { jsPDF } = window.jspdf;
    const pdf=new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
    const node=getStyledHTMLNode();
    await pdf.html(node, {
      x:10, y:10, margin:[10,10,10,10], autoPaging:'text',
      html2canvas:{scale:1},
      callback(doc){ doc.save('document.pdf'); }
    });
  }catch(e){ console.error('PDF error:',e); alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF'); }
  finally{ hideLoader(); }
}

downloadDocxBtn?.addEventListener('click', exportDOCX);
downloadPdfBtn?.addEventListener('click', exportPDF);