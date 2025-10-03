/* WordleAndContexto-JS-03102025-[Complete] */
window.addEventListener('DOMContentLoaded', () => {
  const WORDLE_WORDS = [
    'สวัสดี','ขอบคุณ','สบายดี','มะม่วง','ต้นไม้','ทะเล','ภูเขา','หนังสือ',
    'ปากกา','ดินสอ','โรงเรียน','อาจารย์','นักเรียน','คอมพิวเตอร์','โทรศัพท์',
    'อาหาร','กาแฟ','อร่อย','บ้าน','ครอบครัว','เพื่อน','ความสุข','ความรัก',
    'สวยงาม','อากาศ','ประเทศไทย','กรุงเทพ','เชียงใหม่','ทำงาน','วันหยุด','ดวงดาว',
    'กลางคืน','กลางวัน','สีแดง','สีเขียว','สีน้ำเงิน','ดอกไม้','เรื่องราว','ภาพยนตร์',
    'ดนตรี','กีฬา','ฟุตบอล','เดินทาง','เครื่องบิน','รถยนต์','จักรยาน','อนาคต',
    'ความฝัน','โอกาส','ปัญหา','แก้ไข','พัฒนา','สำเร็จ','ความรู้','การเรียน',
    'สุขภาพ','แข็งแรง','โรงพยาบาล','คุณหมอ','พยาบาล','ตลาด','ช้อปปิ้ง','เงินทอง',
    'ลงทุน','ธนาคาร','ตัวเลข','ภาษาไทย','อังกฤษ','ญี่ปุ่น','วัฒนธรรม','ประเพณี',
    'ประวัติ','ศาสนา','วัดวา','ธรรมชาติ','สิ่งแวดล้อม','โครงการ','ประชุม','วางแผน'
  ];

  const CONTEXTO_PUZZLES = {
    'ดวงอาทิตย์': ['ดวงอาทิตย์','ดาวฤกษ์','แสงแดด','ความร้อน','พลังงาน','ท้องฟ้า','กลางวัน','ดวงจันทร์','ดาวเคราะห์','จักรวาล','โลก','ฤดูร้อน','อวกาศ','พระอาทิตย์','สว่าง','เปลวไฟ','ไฟ','สีเหลือง','เมฆ','สีส้ม','ความอบอุ่น','ทะเลทราย','พืช','ต้นไม้','ออกซิเจน','ภูเขา','ทะเล','แม่น้ำ','ลม'],
    'คอมพิวเตอร์': ['คอมพิวเตอร์','เทคโนโลยี','อินเทอร์เน็ต','ซอฟต์แวร์','ฮาร์ดแวร์','โปรแกรม','ข้อมูล','หน้าจอ','คีย์บอร์ด','เมาส์','โน้ตบุ๊ก','โทรศัพท์','สมาร์ทโฟน','แท็บเล็ต','ทำงาน','เล่นเกม','ไฟฟ้า','ดิจิทัล','โค้ดดิ้ง','เว็บไซต์','อีเมล','ออนไลน์','ระบบ','หน่วยความจำ','การ์ดจอ','ซีพียู','โต๊ะทำงาน','เก้าอี้','สำนักงาน'],
    'กาแฟ': ['กาแฟ','คาเฟอีน','เครื่องดื่ม','ตอนเช้า','ตื่นนอน','แก้ว','ร้อน','เย็น','อเมริกาโน่','ลาเต้','คาปูชิโน่','เมล็ดกาแฟ','ร้านกาแฟ','น้ำตาล','นม','ทำงาน','อ่านหนังสือ','ผ่อนคลาย','ขม','หอม','ชา','น้ำเปล่า','อาหารเช้า','ขนมปัง','เค้ก','บาริสต้า','เครื่องชง','พลังงาน','ง่วงนอน']
  };

  let currentGame = 'wordle';
  let target = ''; let row = 0; let col = 0; let over = false;

  let ctxAnswer = ''; let ctxList = []; let ctxGuesses = []; let ctxOver = false;

  const wordleTab = document.getElementById('wordle-tab');
  const contextoTab = document.getElementById('contexto-tab');
  const wordleGame = document.getElementById('wordle-game');
  const contextoGame = document.getElementById('contexto-game');

  const grid = document.getElementById('wordle-grid');
  const kb = document.getElementById('wordle-keyboard');

  const ctxInput = document.getElementById('contexto-input');
  const ctxBtn = document.getElementById('contexto-guess-btn');
  const ctxListWrap = document.getElementById('contexto-guesses');

  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalAnswer = document.getElementById('modal-answer');
  const playAgainBtn = document.getElementById('play-again-btn');

  const thLetter = /^[ก-ฮะ-ูเ-์ๆ]$/;
  const rnd = (n) => Math.floor(Math.random()*n);
  const pick = (arr) => arr[rnd(arr.length)];

  function setActiveTab(which){
    if (which === 'wordle') {
      wordleTab.classList.add('is-active'); contextoTab.classList.remove('is-active');
      wordleGame.classList.remove('hidden'); contextoGame.classList.add('hidden'); currentGame='wordle';
    } else {
      contextoTab.classList.add('is-active'); wordleTab.classList.remove('is-active');
      contextoGame.classList.remove('hidden'); wordleGame.classList.add('hidden'); currentGame='contexto'; ctxInput.focus();
    }
  }

  // Wordle
  function buildGrid(){
    grid.innerHTML = '';
    grid.style.display = 'grid';
    grid.style.gridTemplateRows = 'repeat(6, 1fr)';
    grid.style.gridTemplateColumns = 'repeat(5, 1fr)';
    grid.style.gap = '6px';
    for (let r=0;r<6;r++){
      for (let c=0;c<5;c++){
        const cell = document.createElement('div');
        cell.id = `cell-${r}-${c}`;
        cell.className = 'cell';
        grid.appendChild(cell);
      }
    }
  }
  function resetWordle(){
    target = pick(WORDLE_WORDS);
    row=0; col=0; over=false;
    buildGrid();
    kb.innerHTML='';
  }
  function addLetter(ch){
    if (over || col>=5 || !thLetter.test(ch)) return;
    const cell = document.getElementById(`cell-${row}-${col}`);
    cell.textContent = ch; col++;
  }
  function backspace(){
    if (over || col<=0) return;
    col--; const cell = document.getElementById(`cell-${row}-${col}`); cell.textContent='';
  }
  function submit(){
    if (over || col<5) return;
    let guess=''; for (let c=0;c<5;c++) guess += document.getElementById(`cell-${row}-${c}`).textContent || '';
    if (!WORDLE_WORDS.includes(guess)) { alert('ไม่พบคำนี้ในพจนานุกรม'); return; }
    for (let c=0;c<5;c++){
      const cell = document.getElementById(`cell-${row}-${c}`); const ch = cell.textContent;
      if (ch === target[c]) cell.classList.add('ok');
      else if (target.includes(ch)) cell.classList.add('mid');
      else cell.classList.add('bad');
    }
    if (guess === target) { over=true; setTimeout(()=>showModal('คุณชนะ!', target), 600); return; }
    row++; col=0; if (row>=6) { over=true; setTimeout(()=>showModal('คุณแพ้แล้ว', target), 600); }
  }

  document.addEventListener('keydown', (e)=>{
    if (currentGame !== 'wordle') return;
    if (e.key === 'Enter') return submit();
    if (e.key === 'Backspace') return backspace();
    if (e.key && thLetter.test(e.key)) return addLetter(e.key);
  });

  // Contexto
  function startContexto(){
    const keys = Object.keys(CONTEXTO_PUZZLES);
    ctxAnswer = keys[rnd(keys.length)];
    ctxList = CONTEXTO_PUZZLES[ctxAnswer];
    ctxGuesses = []; ctxOver=false;
    ctxListWrap.innerHTML=''; ctxInput.value='';
  }
  function ctxGuess(){
    if (ctxOver) return;
    const g = (ctxInput.value||'').trim(); if (!g) return;
    const rank = ctxList.indexOf(g);
    if (rank === -1) { alert('ไม่รู้จักคำนี้ ลองคำอื่นนะ'); ctxInput.value=''; return; }
    if (ctxGuesses.some(x=>x.word===g)) { ctxInput.value=''; return; }
    ctxGuesses.push({ word:g, rank:rank+1 });
    ctxGuesses.sort((a,b)=>a.rank-b.rank);
    renderCtx();
    if (rank === 0) { ctxOver=true; setTimeout(()=>showModal('ถูกต้อง!', ctxList[0]), 500); }
    ctxInput.value='';
  }
  function renderCtx(){
    ctxListWrap.innerHTML='';
    ctxGuesses.forEach(({word,rank})=>{
      const row=document.createElement('div');
      let cls='ctx-bad'; if (rank<=1) cls='ctx-best'; else if (rank<=5) cls='ctx-good'; else if (rank<=15) cls='ctx-mid';
      row.className=`ctx-row ${cls}`;
      row.innerHTML=`<span class="w">${word}</span><span class="r">${rank}</span>`;
      ctxListWrap.appendChild(row);
    });
  }

  // Modal
  function showModal(title, answer){
    modalTitle.textContent = title;
    modalAnswer.innerHTML = `คำตอบคือ: <span class="hl">${answer}</span>`;
    modal.hidden = false;
  }
  playAgainBtn.addEventListener('click', ()=>{
    modal.hidden = true;
    if (currentGame === 'wordle') resetWordle(); else startContexto();
  });

  // Init
  function init(){
    wordleTab.addEventListener('click', ()=> setActiveTab('wordle'));
    contextoTab.addEventListener('click', ()=> setActiveTab('contexto'));
    ctxBtn.addEventListener('click', ctxGuess);
    ctxInput.addEventListener('keydown', (e)=>{ if (e.key==='Enter') ctxGuess(); });
    resetWordle(); startContexto(); setActiveTab('wordle');
  }
  init();
});