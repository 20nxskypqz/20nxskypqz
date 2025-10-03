/* OrganizeDocumentsAutomatically-JS-03102025-[Complete] */
(function(){
  "use strict";

  const addBtn = document.getElementById('add-btn');
  const addMenu = document.getElementById('add-menu');
  const editor = document.getElementById('editor');
  const placeholder = document.getElementById('placeholder');
  const downloadDocxBtn = document.getElementById('download-docx-btn');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');

  // dropdown for add
  if (addBtn && addMenu){
    addBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      addMenu.hidden = !addMenu.hidden;
      const rect = addBtn.getBoundingClientRect();
      addMenu.style.position = 'absolute';
      addMenu.style.left = '0';
      addMenu.style.top = 'calc(100% + 6px)';
    });
    window.addEventListener('click', ()=> { if (!addMenu.hidden) addMenu.hidden = true; });
    addMenu.querySelectorAll('.dropdown-item').forEach(item=>{
      item.addEventListener('click', (e)=>{
        e.preventDefault();
        const type = item.getAttribute('data-type');
        addBlock(type);
        addMenu.hidden = true;
      });
    });
  }

  function ensurePlaceholder(){
    if (editor.querySelectorAll('.content-block').length === 0) {
      placeholder.style.display = 'block';
    } else {
      placeholder.style.display = 'none';
    }
  }

  function addBlock(type){
    ensurePlaceholder();
    const block = document.createElement('div');
    block.className = 'content-block group';
    block.draggable = true;

    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.innerHTML = '<span class="material-symbols-outlined">drag_indicator</span>';
    block.appendChild(handle);

    let el; let ph='';
    if (type === 'h-center') { el = document.createElement('h3'); el.style.textAlign = 'center'; el.style.fontSize='28px'; ph='ใส่หัวเรื่อง...'; }
    else if (type === 'h1') { el = document.createElement('h1'); el.style.fontSize='28px'; ph='ใส่หัวข้อหลัก...'; }
    else if (type === 'h2') { el = document.createElement('h2'); el.style.fontSize='24px'; ph='ใส่หัวข้อย่อย...'; }
    else if (type === 'h4') { el = document.createElement('h4'); el.style.fontSize='18px'; ph='ใส่หัวข้อย่อยของย่อย...'; }
    else { el = document.createElement('p'); el.style.fontSize='16px'; ph='ใส่เนื้อหา...'; }

    el.contentEditable = 'true';
    el.setAttribute('placeholder', ph);
    el.className = 'editable';
    block.appendChild(el);

    const del = document.createElement('button');
    del.className = 'delete-btn';
    del.innerHTML = '<span class="material-symbols-outlined">close</span>';
    del.addEventListener('click', ()=> { block.remove(); ensurePlaceholder(); });
    block.appendChild(del);

    editor.appendChild(block);
    addDrag(block);
    el.focus();
    ensurePlaceholder();
  }

  function addDrag(item){
    let dragged = null;
    item.addEventListener('dragstart', ()=>{ dragged = item; item.classList.add('dragging'); });
    item.addEventListener('dragend', ()=>{ item.classList.remove('dragging'); dragged = null; });
    editor.addEventListener('dragover', (e)=>{
      e.preventDefault();
      const after = getAfter(editor, e.clientY);
      const dragging = editor.querySelector('.dragging');
      if (!dragging) return;
      if (after == null) editor.appendChild(dragging);
      else editor.insertBefore(dragging, after);
    });
    function getAfter(container, y){
      const els = [...container.querySelectorAll('.content-block:not(.dragging)')];
      return els.reduce((closest, child)=>{
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height/2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        else return closest;
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
  }

  // Export helpers
  function styledHTML(){
    const clone = editor.cloneNode(true);
    clone.querySelectorAll('.drag-handle, .delete-btn, #placeholder').forEach(el => el.remove());
    clone.querySelectorAll('[contenteditable]').forEach(el=>{
      el.removeAttribute('contenteditable');
      el.removeAttribute('placeholder');
      const tn = el.tagName.toLowerCase();
      let style = "font-family:'Niramit',sans-serif;";
      if (tn==='h3') style += 'font-size:28px;font-weight:bold;text-align:center;margin:1.5em 0;';
      else if (tn==='h1') style += 'font-size:28px;font-weight:bold;margin:1.5em 0 0.5em 0;';
      else if (tn==='h2') style += 'font-size:24px;font-weight:bold;margin:1.2em 0 0.5em 0;';
      else if (tn==='h4') style += 'font-size:18px;font-weight:bold;margin:1em 0 0.5em 0;';
      else if (tn==='p') style += 'font-size:16px;line-height:1.6;margin-bottom:1em;';
      el.setAttribute('style', style);
      el.className = '';
    });
    clone.querySelectorAll('.content-block').forEach(el => el.removeAttribute('class'));
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:'Niramit',sans-serif;color:#000;margin:2cm;}</style></head><body>${clone.innerHTML}</body></html>`;
  }

  // DOCX
  if (downloadDocxBtn){
    downloadDocxBtn.addEventListener('click', async ()=>{
      try {
        const contentHTML = styledHTML();
        const fileBlob = await htmlToDocx.asBlob(contentHTML);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(fileBlob);
        a.download = 'document.docx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการสร้างไฟล์ DOCX');
      }
    });
  }

  // PDF
  if (downloadPdfBtn){
    downloadPdfBtn.addEventListener('click', ()=>{
      const { jsPDF } = window.jspdf;
      const tmp = document.createElement('div');
      tmp.style.position = 'absolute';
      tmp.style.left = '-9999px';
      tmp.style.width = '794px';
      tmp.innerHTML = styledHTML();
      document.body.appendChild(tmp);

      html2canvas(tmp, { scale: 2, useCORS: true })
      .then(canvas=>{
        const pdf = new jsPDF({ orientation:'portrait', unit:'px', format:'a4' });
        const img = canvas.toDataURL('image/png');
        const w = pdf.internal.pageSize.getWidth();
        const h = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / w;
        const ph = canvas.height / ratio;
        let left = ph; let pos = 0;
        pdf.addImage(img, 'PNG', 0, pos, w, ph);
        left -= h;
        while (left > 0) {
          pos -= h; pdf.addPage(); pdf.addImage(img, 'PNG', 0, pos, w, ph);
          left -= h;
        }
        pdf.save('document.pdf');
      })
      .catch(err=> { console.error(err); alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF'); })
      .finally(()=> tmp.remove());
    });
  }

})();