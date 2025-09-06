/* ===== Theme toggle ===== */
const FI_DAY_HREF='https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-chubby/css/uicons-solid-chubby.css';
const FI_NIGHT_HREF='https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-rounded/css/uicons-solid-rounded.css';
function applyIconTheme(isDark){const link=document.getElementById('fi-theme');if(link)link.setAttribute('href',isDark?FI_NIGHT_HREF:FI_DAY_HREF);const icon=document.getElementById('mode-icon');if(icon)icon.className=isDark?'fi fi-sr-moon':'fi fi-sc-sun';}
function toggleMode(){const isDark=document.body.classList.toggle('dark-mode');document.body.classList.toggle('light-mode',!isDark);const c=document.querySelector('.toggle-circle');if(c){if(isDark)c.classList.remove('light');else c.classList.add('light');}applyIconTheme(isDark);}

/* ===== Time / Countdown (Home) ===== */
function updateTime(){const d=document.getElementById('date-display');const t=document.getElementById('time-display');if(!d||!t)return;const now=new Date();d.textContent=`Date: ${now.toLocaleDateString('en-GB')}`;t.textContent=`Time: ${now.toLocaleTimeString('en-GB')}`;}
function updateCountdown(){const el=document.getElementById('countdown-display');if(!el)return;const target=new Date('January 1, 2026 00:00:00');const now=new Date();const diff=target-now;if(diff<=0){el.textContent='🎉 Happy New Year 2026!';return;}const days=Math.floor(diff/(1000*60*60*24));const hours=Math.floor((diff/(1000*60*60))%24);const minutes=Math.floor((diff/(1000*60))%60);const seconds=Math.floor((diff/1000)%60);el.textContent=`${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;}
function initializeUpdates(){updateTime();updateCountdown();setInterval(updateTime,1000);setInterval(updateCountdown,1000);}

/* ===== Google Sheets fetch (Conan) ===== */
function gvizFetch(sheetId,gid,tq){const url='https://docs.google.com/spreadsheets/d/'+encodeURIComponent(sheetId)+'/gviz/tq?gid='+encodeURIComponent(gid||'0')+(tq?'&tq='+encodeURIComponent(tq):'');return fetch(url).then(r=>r.text()).then(txt=>{const s=txt.indexOf('{');const e=txt.lastIndexOf('}');if(s===-1||e===-1)throw new Error('Unexpected response format');return JSON.parse(txt.slice(s,e+1));});}
function rowToArray(row){return (row.c||[]).map(c=>(c?(c.f!=null?String(c.f):(c.v==null?'':String(c.v))):''));}
function tableToArrays(json){const rows=json?.table?.rows||[];return rows.map(rowToArray);}
function extractHeadersFromCols(json){return (json?.table?.cols||[]).map(c=>(c&&c.label?String(c.label):''));}

const COLUMN_ALIASES={
  epNoTH:['Episode No TH','Episode No. (TH)','ตอนที่ (ไทย)','ตอนที่ไทย','EP TH','Ep TH','EP(TH)'],
  epNoJP:['Episode No JP','Episode No. (JP)','ตอนที่ (ญี่ปุ่น)','ตอนที่ญี่ปุ่น','EP JP','Ep JP','EP(JP)'],
  title:['Episode Title','ชื่อตอน','Title'],
  airDate:['Air Date','วันออกอากาศ','Broadcast Date','On Air','On-Air Date'],
  episodeType:['Episode Type','ประเภทตอน'],
  caseType:['Case Type','ประเภทคดี'],
  keyCharacters:['Key Characters','ตัวละคร','Characters'],
  trivia:['Trivia','เกร็ดความรู้'],
  caseSummary:['Case Summary','สรุปคดี','Summary'],
  mainPlot:['Main Plot Related','เนื้อเรื่องหลัก','Main Plot'],
  checklist:['Checklist','เช็คลิสต์','Check']
};
const ALL_ALIAS_SET=new Set(Object.values(COLUMN_ALIASES).flat().map(s=>s.trim().toLowerCase()));

function normalizeHeader(h){return String(h||'').trim().toLowerCase();}
function findIndexByAliases(headers,aliases){const norm=headers.map(normalizeHeader);for(const a of aliases){const idx=norm.indexOf(a.trim().toLowerCase());if(idx!==-1)return idx;}return -1;}
function buildColumnMap(headers){return{
  epNoTH:findIndexByAliases(headers,COLUMN_ALIASES.epNoTH),
  epNoJP:findIndexByAliases(headers,COLUMN_ALIASES.epNoJP),
  title:findIndexByAliases(headers,COLUMN_ALIASES.title),
  airDate:findIndexByAliases(headers,COLUMN_ALIASES.airDate),
  episodeType:findIndexByAliases(headers,COLUMN_ALIASES.episodeType),
  caseType:findIndexByAliases(headers,COLUMN_ALIASES.caseType),
  keyCharacters:findIndexByAliases(headers,COLUMN_ALIASES.keyCharacters),
  trivia:findIndexByAliases(headers,COLUMN_ALIASES.trivia),
  caseSummary:findIndexByAliases(headers,COLUMN_ALIASES.caseSummary),
  mainPlot:findIndexByAliases(headers,COLUMN_ALIASES.mainPlot),
  checklist:findIndexByAliases(headers,COLUMN_ALIASES.checklist)
};}
function getCell(arr,idx){return idx===-1?'':(arr[idx]||'');}
function isChecked(val){const s=String(val||'').trim().toLowerCase();return ['true','yes','y','1','✓','✔','check','checked'].includes(s);}

/* ===== Detect header row (สำหรับเคสเริ่มที่ A5 เป็นต้นไป) ===== */
function detectHeaderRowIndex(arrays,maxScan=10){
  let bestIdx=-1, bestScore=-1;
  for(let i=0;i<Math.min(arrays.length,maxScan);i++){
    const row=arrays[i]||[];
    const score=row.reduce((acc,cell)=>acc + (ALL_ALIAS_SET.has(String(cell||'').trim().toLowerCase())?1:0),0);
    if(score>bestScore){bestScore=score;bestIdx=i;}
  }
  return (bestScore>=2 ? bestIdx : -1);  // ต้องเจออย่างน้อย 2 ช่องที่แมตช์ alias ถึงจะถือว่าเป็น header
}

/* ===== Render Conan table (42 rows) ===== */
function renderConanTableFromSheet(sheetId,gid){
  const tbody=document.getElementById('conan-table-body'); if(!tbody) return;
  tbody.innerHTML='<tr><td colspan="11">Loading…</td></tr>';

  gvizFetch(sheetId,gid,'select *').then(json=>{
    const arrays=tableToArrays(json);              // แถวข้อมูลจริง (ไม่มีคอลัมน์ label)
    const labels=extractHeadersFromCols(json);     // อาจว่างถ้าไม่มี header
    let headers=[], dataRows=[];

    // 1) ถ้า label จาก cols มีหัวคอลัมน์ >=3 ช่อง ใช้เลย
    const nonEmptyLabels=labels.filter(x=>String(x).trim()!=='');
    if(nonEmptyLabels.length>=3){
      headers=labels;
      dataRows=arrays;
    }else{
      // 2) ลองสแกนหา header row ภายในแถวบนๆ (เผื่อเริ่มที่ A5)
      const idx=detectHeaderRowIndex(arrays,12);
      if(idx!==-1){
        headers=arrays[idx];
        dataRows=arrays.slice(idx+1);
      }else{
        // 3) fallback: ใช้แถวแรกเป็น header
        headers=arrays[0]||[];
        dataRows=arrays.slice(1);
      }
    }

    const map=buildColumnMap(headers);
    if(!dataRows.length){tbody.innerHTML='<tr><td colspan="11">No data.</td></tr>';centerConanLayout();return;}

    const MAX_ROWS=42;
    const rows=dataRows.slice(0,MAX_ROWS);
    while(rows.length<MAX_ROWS) rows.push([]);

    const frag=document.createDocumentFragment();
    rows.forEach(row=>{
      const tr=document.createElement('tr');

      const tdEpTH=document.createElement('td');  tdEpTH.textContent=getCell(row,map.epNoTH); tr.appendChild(tdEpTH);
      const tdEpJP=document.createElement('td');  tdEpJP.textContent=getCell(row,map.epNoJP); tr.appendChild(tdEpJP);
      const tdTitle=document.createElement('td'); tdTitle.textContent=getCell(row,map.title); tr.appendChild(tdTitle);
      const tdAir=document.createElement('td');   tdAir.textContent=getCell(row,map.airDate); tr.appendChild(tdAir);
      const tdEpType=document.createElement('td');tdEpType.textContent=getCell(row,map.episodeType); tr.appendChild(tdEpType);
      const tdCaseType=document.createElement('td'); tdCaseType.textContent=getCell(row,map.caseType); tr.appendChild(tdCaseType);
      const tdChars=document.createElement('td'); tdChars.textContent=getCell(row,map.keyCharacters); tr.appendChild(tdChars);
      const tdTrivia=document.createElement('td');tdTrivia.textContent=getCell(row,map.trivia); tr.appendChild(tdTrivia);
      const tdSummary=document.createElement('td');tdSummary.textContent=getCell(row,map.caseSummary); tr.appendChild(tdSummary);
      const tdMainPlot=document.createElement('td');tdMainPlot.textContent=getCell(row,map.mainPlot); tr.appendChild(tdMainPlot);

      const tdChecklist=document.createElement('td');
      const span=document.createElement('span');
      const checked=isChecked(getCell(row,map.checklist));
      span.className='chk'+(checked?' chk--on':'');
      span.setAttribute('aria-label',checked?'Checked':'Not checked');
      tdChecklist.appendChild(span); tr.appendChild(tdChecklist);

      frag.appendChild(tr);
    });

    tbody.innerHTML=''; tbody.appendChild(frag);
    centerConanLayout();  // จัดกลาง + จัด SS ให้ชิดซ้ายของตาราง
  }).catch(err=>{
    tbody.innerHTML='<tr><td colspan="11">Failed to load sheet. Please check sharing (Anyone with the link can view) or Publish to the web. ('+err.message+')</td></tr>';
    centerConanLayout();
  });
}

/* ===== Helpers: center/align elements ===== */
function centerElementToViewport(el, offsetPx=0){
  if(!el) return;
  el.style.transform='translateX(0)';
  requestAnimationFrame(()=>{
    const rect=el.getBoundingClientRect();
    const vpCenter=(window.visualViewport?window.visualViewport.width:window.innerWidth)/2;
    const elCenter=rect.left + rect.width/2;
    const delta=Math.round(vpCenter - elCenter + offsetPx);
    el.style.transform=`translateX(${delta}px)`;
  });
}
function alignLeftOfAtoLeftOfB(a,b){
  if(!a||!b) return;
  a.style.transform='translateX(0)';
  requestAnimationFrame(()=>{
    const ar=a.getBoundingClientRect();
    const br=b.getBoundingClientRect();
    const delta=Math.round(br.left - ar.left);
    a.style.transform=`translateX(${delta}px)`;
  });
}
function centerConanLayout(){
  const titleGroup=document.querySelector('.conan-page .title-group');
  const table=document.querySelector('.conan-page .conan-table');
  centerElementToViewport(titleGroup,0);
  centerElementToViewport(table,0);

  // SS selector “ซ้ายสุดตรงกับซ้ายของตาราง”
  const picker=document.getElementById('season-picker');
  if (picker && table) alignLeftOfAtoLeftOfB(picker, table);
}

/* อัปเดตเมื่อ resize/orientation/zoom */
window.addEventListener('resize', centerConanLayout);
window.addEventListener('orientationchange', centerConanLayout);

/* ===== Season selector ===== */
const SEASONS=[{label:'Detective Conan SS.1',gid:'0'}];
function setupSeasonPicker(sheetSection){
  const picker=document.getElementById('season-picker'); if(!picker||!sheetSection) return;
  const btn=picker.querySelector('.season-button');
  const menu=picker.querySelector('.season-menu');
  const labelSpan=picker.querySelector('.season-label');

  menu.innerHTML='';
  SEASONS.forEach(s=>{
    const li=document.createElement('li');
    li.textContent=s.label; li.setAttribute('role','option'); li.tabIndex=0;
    li.addEventListener('click',()=>{
      labelSpan.textContent=s.label;
      sheetSection.setAttribute('data-gid',s.gid);
      renderConanTableFromSheet(sheetSection.getAttribute('data-sheet-id'),s.gid);
      menu.hidden=true; btn.setAttribute('aria-expanded','false');
    });
    menu.appendChild(li);
  });

  btn.addEventListener('click',()=>{
    const expanded=btn.getAttribute('aria-expanded')==='true';
    btn.setAttribute('aria-expanded', String(!expanded));
    menu.hidden=expanded;
  });
  document.addEventListener('click',(e)=>{
    if(!picker.contains(e.target)){menu.hidden=true;btn.setAttribute('aria-expanded','false');}
  });
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded',function(){
  // Menu
  const menuToggle=document.querySelector('.menu-toggle');
  const sideMenu=document.querySelector('.side-menu');
  const closeMenu=document.querySelector('.close-menu');
  const overlay=document.querySelector('.menu-overlay');
  function updateMenuIcon(isOpen){if(!menuToggle)return;const icon=menuToggle.querySelector('i');if(icon)icon.className=isOpen?'fi fi-br-cross':'fi fi-br-menu-burger';else menuToggle.textContent=isOpen?'×':'☰';menuToggle.setAttribute('aria-expanded',String(isOpen));menuToggle.setAttribute('aria-label',isOpen?'Close navigation':'Toggle navigation');}
  function toggleMenu(){if(!sideMenu||!menuToggle||!overlay)return;const isOpen=sideMenu.classList.toggle('open');overlay.classList.toggle('visible',isOpen);updateMenuIcon(isOpen);sideMenu.setAttribute('aria-hidden',String(!isOpen));}
  if(menuToggle)menuToggle.addEventListener('click',toggleMenu);
  if(closeMenu)closeMenu.addEventListener('click',toggleMenu);
  if(overlay)overlay.addEventListener('click',toggleMenu);
  updateMenuIcon(false);

  // Theme
  const modeToggle=document.getElementById('mode-toggle');
  if(modeToggle)modeToggle.addEventListener('click',toggleMode);
  applyIconTheme(document.body.classList.contains('dark-mode'));

  // Home timers
  initializeUpdates();

  // Conan
  const sheetSection=document.getElementById('conan-sheet');
  if(sheetSection){
    setupSeasonPicker(sheetSection);
    renderConanTableFromSheet(
      sheetSection.getAttribute('data-sheet-id'),
      sheetSection.getAttribute('data-gid')||'0'
    );
  }else{
    centerConanLayout();