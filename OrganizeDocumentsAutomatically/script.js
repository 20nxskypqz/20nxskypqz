/* OrganizeDocumentsAutomatically-js-03102025-[Complete] */
/* js-OrganizeDocs-01102025-05 — Editor + DOCX/PDF export */
(function(){
  "use strict";

  const addBtn = document.getElementById('add-btn');
  const editor = document.getElementById('editor');
  const placeholder = document.getElementById('placeholder');
  const downloadDocxBtn = document.getElementById('download-docx-btn');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');

  if (!editor) return;

  // Add content block
  function addBlock(tag){
    if (placeholder) placeholder.style.display='none';
    const block = document.createElement('div');
    block.className = 'content-block group relative flex items-start p-2 my-2';
    const el = document.createElement(tag);
    el.contentEditable = 'true';
    el.setAttribute('placeholder','พิมพ์ข้อความ...');
    el.style.outline='none';
    el.style.width='100%';
    if (tag==='h1') el.style.fontSize='28px';
    else if (tag==='h2') el.style.fontSize='24px';
    else if (tag==='h4') el.style.fontSize='18px';
    else el.style.fontSize='16px';
    el.style.lineHeight='1.6';
    block.appendChild(el);
    editor.appendChild(block);
    el.focus();
  }

  // Menu-less simple add
  if (addBtn) addBtn.addEventListener('click', () => addBlock('p'));

  // Export helpers
  function getStyledHTMLContent() {
    const clone = editor.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(el=>{
      el.removeAttribute('contenteditable');
      el.removeAttribute('placeholder');
      const tag = el.tagName.toLowerCase();
      let style = "font-family: 'Niramit', sans-serif;";
      if (tag==='h1'){ style+='font-size:28px;font-weight:bold;margin:1.5em 0 0.5em 0;'; }
      else if (tag==='h2'){ style+='font-size:24px;font-weight:bold;margin:1.2em 0 0.5em 0;'; }
      else if (tag==='h4'){ style+='font-size:18px;font-weight:bold;margin:1em 0 0.5em 0;'; }
      else { style+='font-size:16px;line-height:1.6;margin-bottom:1em;'; }
      el.setAttribute('style', style);
      el.className='';
    });
    clone.querySelectorAll('.content-block').forEach(el=>el.removeAttribute('class'));
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:'Niramit',sans-serif;color:#111;}</style></head><body>${clone.innerHTML}</body></html>`;
  }

  // DOCX (html-to-docx via CDN — ตามที่มีอยู่ในโค้ดเดิมหน้าเอกสาร)
  if (downloadDocxBtn) downloadDocxBtn.addEventListener('click', async ()=>{
    try{
      const contentHTML = getStyledHTMLContent();
      // htmlToDocx.asBlob ต้องถูกโหลดจากหน้า HTML(ตามของเดิม)
      const blob = await htmlToDocx.asBlob(contentHTML);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'document.docx';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(a.href);
    }catch(err){
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ DOCX');
      console.error(err);
    }
  });

  // PDF (html2canvas + jsPDF ตามของเดิม)
  if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', ()=>{
    const printContainer = document.createElement('div');
    printContainer.style.position='absolute';
    printContainer.style.left='-9999px';
    printContainer.style.width='794px';
    printContainer.innerHTML = getStyledHTMLContent();
    document.body.appendChild(printContainer);
    html2canvas(printContainer, { scale: 2, useCORS: true })
      .then(canvas=>{
        const img = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({ orientation:'portrait', unit:'px', format:'a4' });
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / pw;
        const projectedHeight = canvas.height / ratio;
        let heightLeft = projectedHeight;
        let position = 0;

        pdf.addImage(img, 'PNG', 0, position, pw, projectedHeight);
        heightLeft -= ph;
        while (heightLeft > 0) {
          position -= ph;
          pdf.addPage();
          pdf.addImage(img, 'PNG', 0, position, pw, projectedHeight);
          heightLeft -= ph;
        }
        pdf.save('document.pdf');
      })
      .catch(err=>{
        alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
        console.error(err);
      })
      .finally(()=>{ document.body.removeChild(printContainer); });
  });

})();