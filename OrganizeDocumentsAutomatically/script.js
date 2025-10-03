/* OrganizeDocumentsAutomatically-JavaScript-03102025-[Complete] */
(function(){
  const addBtn = document.getElementById('add-btn');
  const addMenu = document.getElementById('add-menu');
  const editor = document.getElementById('editor');
  const placeholder = document.getElementById('placeholder');
  const downloadDocxBtn = document.getElementById('download-docx-btn');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  const loader = document.getElementById('loader');
  const loaderText = document.getElementById('loader-text');

  let draggedItem = null;

  const showLoader = (text="กำลังประมวลผล...") => {
    loaderText.textContent = text;
    loader.style.display = 'block';
  };
  const hideLoader = () => {
    loader.style.display = 'none';
  };

  const toggleAddMenu = (show) => {
    addMenu.style.display = show ? 'block' : (addMenu.style.display === 'block' ? 'none' : 'block');
  };

  if (addBtn) addBtn.addEventListener('click', (e)=>{ e.stopPropagation(); toggleAddMenu(); });
  window.addEventListener('click', () => { if (addMenu && addMenu.style.display === 'block') addMenu.style.display = 'none'; });

  document.querySelectorAll('.add-block-option').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const type = e.currentTarget.getAttribute('data-type');
      addBlock(type);
      addMenu.style.display = 'none';
    });
  });

  function addBlock(type){
    if (placeholder) placeholder.style.display = 'none';
    const block = document.createElement('div');
    block.className = 'content-block group';
    block.style.cssText = 'position:relative;display:flex;align-items:flex-start;padding:8px;margin:8px 0;border:1px solid transparent;border-radius:12px;';
    block.setAttribute('draggable','true');

    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.style.cssText = 'cursor:move;color:#9ca3af;margin-right:12px;padding-top:2px;';
    handle.innerHTML = '<span class="material-symbols-outlined">drag_indicator</span>';
    block.appendChild(handle);

    let content;
    let placeholderText = '';
    if (type === 'h-center') {
      content = document.createElement('h3');
      content.style.cssText = 'width:100%;font-size:28px;font-weight:bold;text-align:center;outline:none;padding:2px;border-radius:6px;';
      placeholderText = 'ใส่หัวเรื่อง...';
    } else if (type === 'h1') {
      content = document.createElement('h1');
      content.style.cssText = 'width:100%;font-size:28px;font-weight:bold;outline:none;padding:2px;border-radius:6px;';
      placeholderText = 'ใส่หัวข้อหลัก...';
    } else if (type === 'h2') {
      content = document.createElement('h2');
      content.style.cssText = 'width:100%;font-size:24px;outline:none;padding:2px;border-radius:6px;';
      placeholderText = 'ใส่หัวข้อย่อย...';
    } else if (type === 'h4') {
      content = document.createElement('h4');
      content.style.cssText = 'width:100%;font-size:18px;outline:none;padding:2px;border-radius:6px;';
      placeholderText = 'ใส่หัวข้อย่อยของย่อย...';
    } else {
      content = document.createElement('p');
      content.style.cssText = 'width:100%;font-size:16px;line-height:1.6;outline:none;padding:2px;border-radius:6px;';
      placeholderText = 'ใส่เนื้อหา...';
    }
    content.setAttribute('contenteditable','true');
    content.setAttribute('data-placeholder', placeholderText);
    content.addEventListener('focus', (e)=>{ if (e.target.textContent===placeholderText) e.target.textContent=''; });
    if (!content.textContent) content.textContent='';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.style.cssText = 'position:absolute;top:50%;right:-6px;transform:translateY(-50%);background:#ef4444;color:#fff;border-radius:999px;height:28px;width:28px;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;opacity:.0;';
    deleteBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">close</span>';
    deleteBtn.onmouseenter = ()=> deleteBtn.style.opacity = '1';
    deleteBtn.onmouseleave = ()=> deleteBtn.style.opacity = '0';
    deleteBtn.onclick = ()=> { block.remove(); checkEmpty(); };

    block.addEventListener('mouseenter', ()=> deleteBtn.style.opacity='1');
    block.addEventListener('mouseleave', ()=> deleteBtn.style.opacity='0');

    block.appendChild(content);
    block.appendChild(deleteBtn);
    editor.appendChild(block);
    addDrag(block);
    content.focus();
  }

  function addDrag(item){
    item.addEventListener('dragstart', ()=>{
      draggedItem = item;
      setTimeout(()=> item.classList.add('dragging'),0);
    });
    item.addEventListener('dragend', ()=>{
      setTimeout(()=>{
        if (draggedItem) draggedItem.classList.remove('dragging');
        draggedItem = null;
      },0);
    });
  }

  editor && editor.addEventListener('dragover',(e)=>{
    e.preventDefault();
    const after = getAfter(editor, e.clientY);
    const dragging = document.querySelector('.dragging');
    if (!dragging) return;
    if (!after) editor.appendChild(dragging);
    else editor.insertBefore(dragging, after);
  });

  function getAfter(container, y){
    const els = [...container.querySelectorAll('.content-block:not(.dragging)')];
    return els.reduce((closest, child)=>{
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height/2;
      if (offset < 0 && offset > closest.offset) return {offset, element:child};
      else return closest;
    }, {offset: -Infinity}).element;
  }

  function checkEmpty(){
    if (editor && editor.querySelectorAll('.content-block').length === 0) {
      if (placeholder) placeholder.style.display = 'block';
    }
  }

  function getStyledHTMLContent(){
    const clone = editor.cloneNode(true);
    clone.querySelectorAll('.drag-handle, .delete-btn, #placeholder').forEach(el=>el.remove());
    clone.querySelectorAll('[contenteditable]').forEach(el=>{
      el.removeAttribute('contenteditable');
      el.removeAttribute('data-placeholder');
      const tag = el.tagName.toLowerCase();
      let style = "font-family: 'Niramit', system-ui, -apple-system, Segoe UI, Arial, sans-serif;";
      if (tag==='h3') style += 'font-size:28px;font-weight:bold;text-align:center;margin:1.5em 0;';
      else if (tag==='h1') style += 'font-size:28px;font-weight:bold;margin:1.5em 0 .5em;';
      else if (tag==='h2') style += 'font-size:24px;font-weight:bold;margin:1.2em 0 .5em;';
      else if (tag==='h4') style += 'font-size:18px;font-weight:bold;margin:1em 0 .5em;';
      else if (tag==='p') style += 'font-size:16px;line-height:1.6;margin:0 0 1em;';
      el.setAttribute('style', style);
      el.className='';
    });
    clone.querySelectorAll('.content-block').forEach(el=>el.removeAttribute('class'));
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:'Niramit', system-ui, -apple-system, Segoe UI, Arial, sans-serif;color:#000;margin:1cm;}</style></head><body>${clone.innerHTML}</body></html>`;
  }

  // DOCX
  if (downloadDocxBtn) downloadDocxBtn.addEventListener('click', async ()=>{
    showLoader('กำลังสร้างไฟล์ DOCX...');
    try{
      // use html-to-docx from CDN already loaded on page (per original design)
      if (!window.htmlToDocx) throw new Error('html-to-docx library not loaded');
      const blob = await window.htmlToDocx.asBlob(getStyledHTMLContent());
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'document.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }catch(err){
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ DOCX');
    }finally{
      hideLoader();
    }
  });

  // PDF (vector text via print)
  if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', ()=>{
    showLoader('กำลังสร้างไฟล์ PDF...');
    try{
      const win = window.open('', '_blank');
      win.document.open();
      win.document.write(getStyledHTMLContent()
        .replace('<style>','<style>@page{margin:1cm;} body{margin:1cm;color:#000;}'));
      win.document.close();
      win.focus();
      win.print();
      setTimeout(()=>{ win.close(); hideLoader(); }, 500);
    }catch(err){
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
      hideLoader();
    }
  });
})();