// WordleAndContexto-js-03102025-[Complete]

window.addEventListener('DOMContentLoaded', () => {
  // =========================
  // DATA & STATE
  // =========================
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
  let currentGame = 'wordle';

  // Wordle
  let target = '';
  let row = 0, col = 0;
  let over = false;

  // Contexto
  const CONTEXTO_PUZZLES = {
    'ดวงอาทิตย์': ['ดวงอาทิตย์','ดาวฤกษ์','แสงแดด','ความร้อน','พลังงาน','ท้องฟ้า','กลางวัน','ดวงจันทร์','ดาวเคราะห์','จักรวาล','โลก','ฤดูร้อน','อวกาศ','พระอาทิตย์','สว่าง','เปลวไฟ','ไฟ','สีเหลือง','เมฆ','สีส้ม','ความอบอุ่น','ทะเลทราย','พืช','ต้นไม้','ออกซิเจน','ภูเขา','ทะเล','แม่น้ำ','ลม'],
    'คอมพิวเตอร์': ['คอมพิวเตอร์','เทคโนโลยี','อินเทอร์เน็ต','ซอฟต์แวร์','ฮาร์ดแวร์','โปรแกรม','ข้อมูล','หน้าจอ','คีย์บอร์ด','เมาส์','โน้ตบุ๊ก','โทรศัพท์','สมาร์ทโฟน','แท็บเล็ต','ทำงาน','เล่นเกม','ไฟฟ้า','ดิจิทัล','โค้ดดิ้ง','เว็บไซต์','อีเมล','ออนไลน์','ระบบ','หน่วยความจำ','การ์ดจอ','ซีพียู','โต๊ะทำงาน','เก้าอี้','สำนักงาน'],
    'กาแฟ': ['กาแฟ','คาเฟอีน','เครื่องดื่ม','ตอนเช้า','ตื่นนอน','แก้ว','ร้อน','เย็น','อเมริกาโน่','ลาเต้','คาปูชิโน่','เมล็ดกาแฟ','ร้านกาแฟ','น้ำตาล','นม','ทำงาน','อ่านหนังสือ','ผ่อนคลาย','ขม','หอม','ชา','น้ำเปล่า','อาหารเช้า','ขนมปัง','เค้ก','บาริสต้า','เครื่องชง','พลังงาน','ง่วงนอน']
  };
  let ctxAnswer = '';
  let ctxList = [];
  let ctxGuesses = [];
  let ctxOver = false;

  // =========================
  // DOM refs
  // =========================
  const wordleTab = document.getElementById('wordle-tab');
  const contextoTab = document.getElementById('contexto-tab');
  const wordleGame = document.getElementById('wordle-game');
  const contextoGame = document.getElementById('contexto-game');
  const grid = document.getElementById('wordle-grid');

  const ctxInput = document.getElementById('contexto-input');
  const ctxBtn = document.getElementById('contexto-guess-btn');
  const ctxListEl = document.getElementById('contexto-guesses');

  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalAnswer = document.getElementById('modal-answer');
  const playAgain = document.getElementById('play-again-btn');

  // =========================
  // Helpers
  // =========================
  const isThaiChar = ch => /^[ก-ฮะ-ูเ-์ๆ]$/.test(ch);

  function setActiveTab(which){
    if(which==='wordle'){
      wordleTab.classList.add('active'); contextoTab.classList.remove('active');
      wordleGame.classList.remove('hidden'); contextoGame.classList.add('hidden');
      currentGame = 'wordle';
    }else{
      contextoTab.classList.add('active'); wordleTab.classList.remove('active');
      contextoGame.classList.remove('hidden'); wordleGame.classList.add('hidden');
      currentGame = 'contexto';
    }
  }

  function showModal(title, answer){
    modalTitle.textContent = title;
    modalAnswer.innerHTML = `คำตอบคือ: <strong>${answer}</strong>`;
    modal.classList.remove('hidden');
  }
  function hideModal(){ modal.classList.add('hidden'); }

  // =========================
  // WORDLE (no virtual keyboard)
  // =========================
  function buildGrid(){
    grid.innerHTML = '';
    for(let r=0;r<6;r++){
      for(let c=0;c<5;c++){
        const d = document.createElement('div');
        d.id = `tile-${r}-${c}`;
        d.className = 'tile';
        grid.appendChild(d);
      }
    }
  }
  function startWordle(){
    target = WORDLE_WORDS[Math.floor(Math.random()*WORDLE_WORDS.length)];
    row=0; col=0; over=false;
    buildGrid(); hideModal();
    // console.log('Wordle Ans:', target);
  }
  function setTile(r,c,ch){
    const t = document.getElementById(`tile-${r}-${c}`);
    t.textContent = ch || '';
  }
  function handleKey(key){
    if(over) return;
    if(key==='Enter'){ submitGuess(); return; }
    if(key==='Backspace'){
      if(col>0){ col--; setTile(row,col,''); }
      return;
    }
    if(col<5 && isThaiChar(key)){
      setTile(row,col,key);
      col++;
      return;
    }
  }
  function submitGuess(){
    if(col<5) return; // not full
    let guess=''; for(let i=0;i<5;i++) guess += document.getElementById(`tile-${row}-${i}`).textContent;
    if(!WORDLE_WORDS.includes(guess)){ alert('ไม่พบคำนี้ในพจนานุกรม'); return; }

    const targetLetters = target.split('');
    const guessLetters = guess.split('');
    const counts = {};
    targetLetters.forEach(ch=>{ counts[ch]=(counts[ch]||0)+1; });

    // exact
    for(let i=0;i<5;i++){
      const t = document.getElementById(`tile-${row}-${i}`);
      if(guessLetters[i]===targetLetters[i]){
        t.classList.add('state-correct','flip');
        counts[guessLetters[i]]--;
      }
    }
    // present/absent
    for(let i=0;i<5;i++){
      const t = document.getElementById(`tile-${row}-${i}`);
      if(t.classList.contains('state-correct')) continue;
      const ch = guessLetters[i];
      if(targetLetters.includes(ch) && counts[ch]>0){
        t.classList.add('state-present','flip'); counts[ch]--;
      }else{
        t.classList.add('state-absent','flip');
      }
    }

    if(guess===target){
      over=true; setTimeout(()=>showModal('คุณชนะ!', target), 600);
    }else{
      row++; col=0;
      if(row===6){ over=true; setTimeout(()=>showModal('คุณแพ้แล้ว', target), 600); }
    }
  }

  document.addEventListener('keyup', (e)=>{
    if(currentGame!=='wordle') return;
    handleKey(e.key);
  });

  // =========================
  // CONTEXTO (robust match)
  // =========================
  const ZW_RE = /[\u200B\u200C\u200D\uFEFF]/g;
  const WS_RE = /\s+/g;
  const norm = s => s.normalize('NFC').replace(ZW_RE,'').replace(WS_RE,'').trim();

  let ctxIndexMap = new Map();

  function startContexto(){
    const keys = Object.keys(CONTEXTO_PUZZLES);
    const pick = keys[Math.floor(Math.random()*keys.length)];
    ctxAnswer = pick;
    ctxList = CONTEXTO_PUZZLES[pick];
    ctxGuesses = []; ctxOver = false;
    ctxListEl.innerHTML = '';
    ctxInput.value = '';
    hideModal();

    ctxIndexMap = new Map();
    ctxList.forEach((w,i)=> ctxIndexMap.set(norm(w), i+1));
  }
  function renderCtx(){
    ctxListEl.innerHTML = '';
    ctxGuesses.forEach(({word,rank})=>{
      const div = document.createElement('div');
      let cls = 'guess-red';
      if(rank<=1) cls='guess-green';
      else if(rank<=5) cls='guess-yellow';
      else if(rank<=15) cls='guess-orange';
      div.className = `guess-item ${cls}`;
      div.innerHTML = `<span class="w">${word}</span><span class="r" style="font-size:20px; font-weight:800;">${rank}</span>`;
      ctxListEl.appendChild(div);
    });
  }
  function guessCtx(){
    if(ctxOver) return;
    const raw = ctxInput.value;
    const g = norm(raw);
    if(!g) return;

    const rank = ctxIndexMap.get(g) || -1;
    if(rank!==-1){
      if(!ctxGuesses.some(x=>norm(x.word)===g)){
        ctxGuesses.push({word: raw.trim(), rank});
        ctxGuesses.sort((a,b)=>a.rank-b.rank);
        renderCtx();
        if(rank===1){ ctxOver=true; setTimeout(()=>showModal('ถูกต้อง!', ctxList[0]), 400); }
      }
    }else{
      alert('ไม่รู้จักคำนี้ ลองคำอื่นนะ');
    }
    ctxInput.value='';
  }

  // =========================
  // Events
  // =========================
  function bindEvents(){
    wordleTab.addEventListener('click', ()=> setActiveTab('wordle'));
    contextoTab.addEventListener('click', ()=> setActiveTab('contexto'));
    ctxBtn.addEventListener('click', guessCtx);
    ctxInput.addEventListener('keyup', e=>{ if(e.key==='Enter') guessCtx(); });

    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') hideModal(); });
    modal.addEventListener('click', (e)=>{ if(e.target===modal) hideModal(); });
    playAgain.addEventListener('click', ()=>{
      if(currentGame==='wordle') startWordle(); else startContexto();
      hideModal();
    });
  }

  // =========================
  // Init
  // =========================
  function init(){
    bindEvents();
    startWordle();
    startContexto();
    setActiveTab('wordle');
  }
  init();
});