/* WordleAndContexto-JavaScript-03102025-[Complete] */
(function(){
  // WORDLE
  const WORDLE_WORDS = [
    'สวัสดี','ขอบคุณ','สบายดี','มะม่วง','ต้นไม้','ทะเล','ภูเขา','หนังสือ',
    'ปากกา','ดินสอ','โรงเรียน','อาจารย์','นักเรียน','คอมพิวเตอร์','โทรศัพท์',
    'อาหาร','กาแฟ','อร่อย','บ้าน','ครอบครัว','เพื่อน','ความสุข','ความรัก',
    'สวยงาม','อากาศ','ประเทศไทย','กรุงเทพ','เชียงใหม่','ทำงาน','วันหยุด'
  ];
  let wordleTarget=''; let row=0, col=0; let over=false;

  function createGrid(){
    const grid = document.getElementById('wordle-grid');
    grid.innerHTML='';
    for(let i=0;i<6;i++){
      for(let j=0;j<5;j++){
        const d=document.createElement('div'); d.id=`tile-${i}-${j}`;
        grid.appendChild(d);
      }
    }
  }
  function startWordle(){
    wordleTarget = WORDLE_WORDS[Math.floor(Math.random()*WORDLE_WORDS.length)];
    row=0; col=0; over=false; createGrid();
    console.log('Wordle answer:',wordleTarget);
  }
  function addLetter(ch){
    if (over || col>=5) return;
    const t=document.getElementById(`tile-${row}-${col}`);
    t.textContent=ch; col++;
  }
  function deleteLetter(){
    if (over || col<=0) return;
    col--; const t=document.getElementById(`tile-${row}-${col}`); t.textContent='';
  }
  function submitGuess(){
    if (over || col<5) return;
    const guess = Array.from({length:5}, (_,i)=>document.getElementById(`tile-${row}-${i}`).textContent).join('');
    if (!WORDLE_WORDS.includes(guess)) { alert('ไม่พบคำนี้ในพจนานุกรม'); return; }
    const g=guess.split(''), t=wordleTarget.split(''); const cnt={};
    t.forEach(c=>cnt[c]=(cnt[c]||0)+1);
    for(let i=0;i<5;i++){
      const tile=document.getElementById(`tile-${row}-${i}`);
      if(g[i]===t[i]){ tile.style.background='#16a34a'; tile.style.borderColor='#16a34a'; cnt[g[i]]--; }
    }
    for(let i=0;i<5;i++){
      const tile=document.getElementById(`tile-${row}-${i}`);
      if(tile.style.background) continue;
      if(cnt[g[i]]>0){ tile.style.background='#ca8a04'; tile.style.borderColor='#ca8a04'; cnt[g[i]]--; }
      else { tile.style.background='#334155'; tile.style.borderColor='#334155'; }
    }
    if (guess===wordleTarget){ over=true; showModal('คุณชนะ!', wordleTarget); }
    else { row++; col=0; if(row===6){ over=true; showModal('คุณแพ้แล้ว', wordleTarget); } }
  }
  document.addEventListener('keyup',(e)=>{
    if (document.getElementById('contexto-game') && !document.getElementById('contexto-game').hasAttribute('hidden')){
      return; // ignore keys when Contexto visible
    }
    if (/^[ก-ฮะ-ูเ-์ๆ]$/.test(e.key)) addLetter(e.key);
    else if (e.key==='Backspace') deleteLetter();
    else if (e.key==='Enter') submitGuess();
  });

  // CONTEXTO
  const CONTEXTO_PUZZLES = {
    'ดวงอาทิตย์': ['ดวงอาทิตย์','ดาวฤกษ์','แสงแดด','ความร้อน','พลังงาน','ท้องฟ้า','กลางวัน','ดวงจันทร์','ดาวเคราะห์'],
    'คอมพิวเตอร์': ['คอมพิวเตอร์','เทคโนโลยี','อินเทอร์เน็ต','ซอฟต์แวร์','ฮาร์ดแวร์','โปรแกรม','ข้อมูล','หน้าจอ','คีย์บอร์ด'],
    'กาแฟ': ['กาแฟ','คาเฟอีน','เครื่องดื่ม','ตอนเช้า','ตื่นนอน','แก้ว','ร้อน','เย็น','ลาเต้']
  };
  let ctxTarget='', ctxList=[], ctxGuesses=[], ctxOver=false;

  function startContexto(){
    const keys = Object.keys(CONTEXTO_PUZZLES);
    ctxTarget = keys[Math.floor(Math.random()*keys.length)];
    ctxList = CONTEXTO_PUZZLES[ctxTarget];
    ctxGuesses = []; ctxOver=false;
    renderCtx();
    console.log('Contexto answer:', ctxList[0]);
  }
  function guessCtx(word){
    if (ctxOver) return;
    const rank = ctxList.indexOf(word);
    if (rank===-1){ alert('ไม่รู้จักคำนี้ ลองคำอื่นนะ'); return; }
    if (ctxGuesses.some(g=>g.word===word)) return;
    ctxGuesses.push({word, rank:rank+1});
    ctxGuesses.sort((a,b)=>a.rank-b.rank);
    renderCtx();
    if (rank===0){ ctxOver=true; showModal('ถูกต้อง!', ctxList[0]); }
  }
  function renderCtx(){
    const box = document.getElementById('contexto-guesses');
    if (!box) return;
    box.innerHTML='';
    ctxGuesses.forEach(({word,rank})=>{
      const d=document.createElement('div'); d.className='card';
      d.style.background = rank===1 ? '#16a34a' : rank<=5 ? '#eab308' : rank<=15 ? '#f97316' : '#ef4444';
      d.style.color='#fff'; d.style.display='flex'; d.style.justifyContent='space-between';
      d.innerHTML = `<span style="font-weight:700">${word}</span><span style="font-weight:800">${rank}</span>`;
      box.appendChild(d);
    });
  }
  document.getElementById('contexto-guess-btn')?.addEventListener('click', ()=>{
    const inp = document.getElementById('contexto-input');
    const v = (inp.value||'').trim();
    if (v) guessCtx(v);
    inp.value=''; inp.focus();
  });
  document.getElementById('contexto-input')?.addEventListener('keyup', (e)=>{
    if (e.key==='Enter'){ const v=(e.target.value||'').trim(); if (v){ guessCtx(v); e.target.value=''; } }
  });

  // Tabs
  function switchGame(g){
    const wg = document.getElementById('wordle-game');
    const cg = document.getElementById('contexto-game');
    const wt = document.getElementById('wordle-tab');
    const ct = document.getElementById('contexto-tab');
    if (g==='wordle'){ wg.hidden=false; cg.hidden=true; wt.classList.add('btn-primary'); ct.classList.remove('btn-primary'); }
    else { wg.hidden=true; cg.hidden=false; ct.classList.add('btn-primary'); wt.classList.remove('btn-primary'); }
  }
  document.getElementById('wordle-tab')?.addEventListener('click', ()=>switchGame('wordle'));
  document.getElementById('contexto-tab')?.addEventListener('click', ()=>switchGame('contexto'));

  // Modal
  function showModal(title, ans){
    const m = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-answer').innerHTML = `คำตอบคือ: <strong>${ans}</strong>`;
    m.hidden=false;
  }
  document.getElementById('play-again-btn')?.addEventListener('click', ()=>{
    const cgHidden = document.getElementById('contexto-game').hidden;
    if (cgHidden) startWordle(); else startContexto();
    document.getElementById('modal').hidden=true;
  });

  // init
  const onReady = ()=>{
    startWordle();
    startContexto();
    switchGame('wordle');
  };
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();