// js-OrganizeDocumentsAutomatically-21092025-07

/**********************
 * NAV & THEME TOGGLES
 **********************/
const sideMenu = document.querySelector('.side-menu');
const menuToggleBtn = document.querySelector('.menu-toggle');
const closeMenuBtn = document.querySelector('.close-menu');
const menuOverlay = document.querySelector('.menu-overlay');
const sectionToggles = document.querySelectorAll('.menu-section-toggle');

function openMenu() {
  sideMenu.classList.add('open');
  menuOverlay.classList.add('visible');
  sideMenu.setAttribute('aria-hidden', 'false');
  menuToggleBtn.setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  sideMenu.classList.remove('open');
  menuOverlay.classList.remove('visible');
  sideMenu.setAttribute('aria-hidden', 'true');
  menuToggleBtn.setAttribute('aria-expanded', 'false');
}
if (menuToggleBtn) menuToggleBtn.addEventListener('click', openMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

sectionToggles.forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    const ul = btn.nextElementSibling;
    if (!ul) return;
    if (expanded) {
      ul.setAttribute('hidden', '');
    } else {
      ul.removeAttribute('hidden');
    }
  });
});

// Theme (day/night) capsule
const modeToggle = document.getElementById('mode-toggle');
if (modeToggle) {
  modeToggle.addEventListener('click', () => {
    const body = document.body;
    const circleIcon = document.getElementById('mode-icon');
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    if (isDark) {
      circleIcon.className = 'fi fi-sr-moon-stars';
    } else {
      circleIcon.className = 'fi fi-sc-sun';
    }
  });
}

/**********************
 * EDITOR LOGIC
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

function showLoader(text = 'กำลังประมวลผล...') {
  if (!loader) return;
  loaderText.textContent = text;
  loader.style.display = 'flex';
}
function hideLoader() {
  if (!loader) return;
  loader.style.display = 'none';
}

// Menu
if (addBtn && addMenu) {
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    addMenu.style.display = addMenu.style.display === 'block' ? 'none' : 'block';
  });
  window.addEventListener('click', () => {
    if (addMenu.style.display === 'block') addMenu.style.display = 'none';
  });
  document.querySelectorAll('.add-block-option').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const type = e.target.getAttribute('data-type');
      addBlock(type);
      addMenu.style.display = 'none';
    });
  });
}

function checkEditorEmpty() {
  if (!editor || !placeholder) return;
  if (editor.querySelectorAll('.content-block').length === 0) {
    placeholder.style.display = 'block';
  }
}

// Create block
function addBlock(type) {
  if (!editor) return;
  if (placeholder) placeholder.style.display = 'none';

  const block = document.createElement('div');
  block.className = 'content-block group relative flex items-start p-2 my-2 border border-transparent hover:border-gray-200 rounded-lg';
  block.setAttribute('draggable', 'true');

  const handle = document.createElement('div');
  handle.className = 'drag-handle cursor-move text-gray-400 opacity-0 group-hover:opacity-100 mr-3 pt-1 transition-opacity';
  handle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>`;
  block.appendChild(handle);

  let content;
  let placeholderText = '';
  if (type === 'h-center') {
    content = document.createElement('h3');
    content.className = 'ed-h3c';
    placeholderText = 'ใส่หัวเรื่อง...';
  } else if (type === 'h1') {
    content = document.createElement('h1');
    content.className = 'ed-h1';
    placeholderText = 'ใส่หัวข้อหลัก...';
  } else if (type === 'h2') {
    content = document.createElement('h2');
    content.className = 'ed-h2';
    placeholderText = 'ใส่หัวข้อย่อย...';
  } else if (type === 'h4') {
    content = document.createElement('h4');
    content.className = 'ed-h4';
    placeholderText = 'ใส่หัวข้อย่อยของย่อย...';
  } else {
    content = document.createElement('p');
    content.className = 'ed-p';
    placeholderText = 'ใส่เนื้อหา...';
  }
  content.setAttribute('contenteditable', 'true');
  content.setAttribute('placeholder', placeholderText);
  block.appendChild(content);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  deleteBtn.onclick = () => { block.remove(); checkEditorEmpty(); };
  block.appendChild(deleteBtn);

  editor.appendChild(block);
  addDragEvents(block);
  content.focus();
}

// Drag & drop
function addDragEvents(item) {
  item.addEventListener('dragstart', () => { draggedItem = item; setTimeout(() => item.classList.add('dragging'), 0); });
  item.addEventListener('dragend', () => { setTimeout(() => { if(draggedItem) draggedItem.classList.remove('dragging'); draggedItem = null; }, 0); });
}
if (editor) {
  editor.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(editor, e.clientY);
    const currentDragging = document.querySelector('.dragging');
    if (!currentDragging) return;
    if (afterElement == null) { editor.appendChild(currentDragging); } else { editor.insertBefore(currentDragging, afterElement); }
  });
}
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.content-block:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) { return { offset: offset, element: child }; } else { return closest; }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**************************************
 * EXPORT HELPERS (DOCX / PDF)
 **************************************/
function getStyledHTMLContent() {
  // Clone editor and strip editor-only UI
  const clone = editor.cloneNode(true);
  clone.querySelectorAll('.drag-handle, .delete-btn, #placeholder').forEach(el => el.remove());
  clone.querySelectorAll('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('placeholder');
    const tag = el.tagName.toLowerCase();
    let style = 'font-family: Niramit, Sarabun, sans-serif; color:#000;'; // << force black text
    if (tag === 'h3') style += 'font-size: 26px; font-weight: bold; text-align: center; margin: 1.5em 0;';
    else if (tag === 'h1') style += 'font-size: 26px; font-weight: bold; margin: 1.2em 0 0.4em 0;';
    else if (tag === 'h2') style += 'font-size: 22px; font-weight: bold; margin: 1.0em 0 0.4em 0;';
    else if (tag === 'h4') style += 'font-size: 17px; font-weight: bold; margin: 0.8em 0 0.4em 0;';
    else if (tag === 'p') style += 'font-size: 15px; line-height: 1.6; margin: 0 0 0.8em 0;';
    el.setAttribute('style', style);
    el.className = '';
  });
  clone.querySelectorAll('.content-block').forEach(el => el.removeAttribute('class'));

  // Return full HTML document with white background + black text
  const html =
    `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body{font-family:Niramit, Sarabun, sans-serif; color:#000; background:#fff; }
      </style>
    </head><body>${clone.innerHTML}</body></html>`;
  return html;
}

/** DOCX (fix: เปลี่ยนไปใช้ฟังก์ชัน UMD ที่คืน ArrayBuffer แล้วสร้าง Blob เอง) */
async function exportDOCX() {
  showLoader('กำลังสร้างไฟล์ DOCX...');
  try {
    const html = getStyledHTMLContent();

    // รองรับหลายชื่อฟังก์ชันของ UMD build
    const docxFn =
      window.htmlToDocx ||
      window.HTMLtoDOCX ||
      (window.htmlToDocx && window.htmlToDocx.default);

    if (typeof docxFn !== 'function') {
      throw new Error('html-to-docx library not loaded');
    }

    // ขอเนื้อหาเป็น ArrayBuffer แล้วแปลงเป็น Blob
    const arrayBuffer = await docxFn(html/*, options สามารถใส่เพิ่มภายหลังได้ */);
    const blob = new Blob([arrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'document.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error('DOCX error:', err);
    alert('เกิดข้อผิดพลาดในการสร้างไฟล์ DOCX');
  } finally {
    hideLoader();
  }
}

/** PDF (fix: margin 2 ซม. ทุกด้าน + บังคับตัวอักษรสีดำในไฟล์) */
async function exportPDF() {
  showLoader('กำลังสร้างไฟล์ PDF...');
  try {
    const { jsPDF } = window.jspdf;

    // ใช้ container ชั่วคราว ที่กำหนดความกว้าง A4 (px @ 96DPI = ~794px)
    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-99999px';
    printContainer.style.top = '0';
    printContainer.style.width = '794px';
    printContainer.innerHTML = getStyledHTMLContent(); // มี background ขาว + ตัวหนังสือสีดำ
    document.body.appendChild(printContainer);

    const canvas = await html2canvas(printContainer, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4', compress: true });

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    // 2 ซม. -> พิกเซล (96dpi): 2 / 2.54 * 96 ≈ 75.6px
    const margin = Math.round(96 * 2 / 2.54); // ≈ 76px
    const innerW = pdfW - margin * 2;
    const innerH = pdfH - margin * 2;

    const imgW = innerW;
    const imgH = canvas.height * (imgW / canvas.width);

    let heightLeft = imgH;
    let positionY = margin;

    // หน้าแรก
    pdf.addImage(imgData, 'PNG', margin, positionY, imgW, imgH);
    heightLeft -= innerH;

    // หน้าถัดไป (เลื่อนภาพขึ้นทีละหน้า)
    while (heightLeft > 0) {
      pdf.addPage();
      positionY = margin - (imgH - heightLeft);
      pdf.addImage(imgData, 'PNG', margin, positionY, imgW, imgH);
      heightLeft -= innerH;
    }

    pdf.save('document.pdf');
    document.body.removeChild(printContainer);
  } catch (err) {
    console.error('PDF error:', err);
    alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
  } finally {
    hideLoader();
  }
}

// Bind buttons
if (downloadDocxBtn) downloadDocxBtn.addEventListener('click', exportDOCX);
if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', exportPDF);