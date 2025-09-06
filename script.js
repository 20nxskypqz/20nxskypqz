/* ===================== THEME TOGGLE ===================== */
var FI_DAY_HREF  = 'https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-chubby/css/uicons-solid-chubby.css';
var FI_NIGHT_HREF= 'https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-rounded/css/uicons-solid-rounded.css';

function applyIconTheme(isDark) {
  try {
    var link = document.getElementById('fi-theme');
    if (link) link.setAttribute('href', isDark ? FI_NIGHT_HREF : FI_DAY_HREF);
    var icon = document.getElementById('mode-icon');
    if (icon) icon.className = isDark ? 'fi fi-sr-moon' : 'fi fi-sc-sun';
  } catch(e) {}
}

function toggleMode() {
  try {
    var isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    var c = document.querySelector('.toggle-circle');
    if (c) { if (isDark) c.classList.remove('light'); else c.classList.add('light'); }
    applyIconTheme(isDark);
  } catch(e) {}
}

/* ===================== HOME: CLOCK & COUNTDOWN ===================== */
function updateTime() {
  try {
    var dateEl = document.getElementById('date-display');
    var timeEl = document.getElementById('time-display');
    if (!dateEl || !timeEl) return;
    var now = new Date();
    dateEl.textContent = 'Date: ' + now.toLocaleDateString('en-GB');
    timeEl.textContent = 'Time: ' + now.toLocaleTimeString('en-GB');
  } catch(e) {}
}
function updateCountdown() {
  try {
    var el = document.getElementById('countdown-display');
    if (!el) return;
    var target = new Date('January 1, 2026 00:00:00');
    var now = new Date();
    var diff = target - now;
    if (diff <= 0) { el.textContent = '🎉 Happy New Year 2026!'; return; }
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff / 3600000) % 24);
    var minutes = Math.floor((diff / 60000) % 60);
    var seconds = Math.floor((diff / 1000) % 60);
    el.textContent = days + ' days ' + hours + ' hours ' + minutes + ' minutes ' + seconds + ' seconds';
  } catch(e) {}
}
function initializeUpdates() {
  updateTime(); updateCountdown();
  setInterval(updateTime, 1000);
  setInterval(updateCountdown, 1000);
}

/* ===================== GOOGLE SHEETS HELPERS ===================== */
/* NOTE: ตัด optional chaining ออกทั้งหมด เพื่อกัน error บนเบราว์เซอร์เก่า */
function gvizFetch(sheetId, gid, tq) {
  var url = 'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(sheetId) +
            '/gviz/tq?gid=' + encodeURIComponent(gid || '0') +
            (tq ? '&tq=' + encodeURIComponent(tq) : '');
  return fetch(url).then(function(r){ return r.text(); }).then(function(txt){
    var s = txt.indexOf('{'); var e = txt.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('Unexpected response format');
    return JSON.parse(txt.slice(s, e + 1));
  });
}
function getTable(json)     { return (json && json.table) ? json.table : null; }
function getRows(json)      { var t=getTable(json); return (t && t.rows) ? t.rows : []; }
function getCols(json)      { var t=getTable(json); return (t && t.cols) ? t.cols : []; }
function rowToArray(row)    {
  var out = []; var cells = (row && row.c) ? row.c : [];
  for (var i=0;i<cells.length;i++) {
    var c = cells[i];
    out.push( c ? (c.f!=null ? String(c.f) : (c.v==null ? '' : String(c.v))) : '' );
  }
  return out;
}
function tableToArrays(json) {
  var rows = getRows(json);
  var out = [];
  for (var i=0;i<rows.length;i++) out.push(rowToArray(rows[i]));
  return out;
}
function extractHeadersFromCols(json) {
  var cols = getCols(json);
  var out = [];
  for (var i=0;i<cols.length;i++) {
    var c = cols[i];
    out.push( (c && c.label) ? String(c.label) : '' );
  }
  return out;
}

/* ==== ALIASES (หลีกเลี่ยง .flat()) ==== */
var COLUMN_ALIASES = {
  epNoTH:      ['Episode No TH','Episode No. (TH)','ตอนที่ (ไทย)','ตอนที่ไทย','EP TH','Ep TH','EP(TH)'],
  epNoJP:      ['Episode No JP','Episode No. (JP)','ตอนที่ (ญี่ปุ่น)','ตอนที่ญี่ปุ่น','EP JP','Ep JP','EP(JP)'],
  title:       ['Episode Title','ชื่อตอน','Title'],
  airDate:     ['Air Date','วันออกอากาศ','Broadcast Date','On Air','On-Air Date'],
  episodeType: ['Episode Type','ประเภทตอน'],
  caseType:    ['Case Type','ประเภทคดี'],
  keyCharacters:['Key Characters','ตัวละคร','Characters'],
  trivia:      ['Trivia','เกร็ดความรู้'],
  caseSummary: ['Case Summary','สรุปคดี','Summary'],
  mainPlot:    ['Main Plot Related','เนื้อเรื่องหลัก','Main Plot'],
  checklist:   ['Checklist','เช็คลิสต์','Check']
};
function flattenAliasObject(obj){
  var res = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj,k)) {
    var arr = obj[k];
    for (var i=0;i<arr.length;i++) res.push(arr[i]);
  }
  return res;
}
var ALL_ALIAS_ARRAY = flattenAliasObject(COLUMN_ALIASES);
function normalizeHeader(h){ return String(h || '').trim().toLowerCase(); }
function findIndexByAliases(headers, aliases){
  var norm = [];
  for (var i=0;i<headers.length;i++) norm.push(normalizeHeader(headers[i]));
  for (var j=0;j<aliases.length;j++) {
    var key = normalizeHeader(aliases[j]);
    var idx = norm.indexOf(key);
    if (idx !== -1) return idx;
  }
  return -1;
}
function buildColumnMap(headers){
  return {
    epNoTH:       findIndexByAliases(headers, COLUMN_ALIASES.epNoTH),
    epNoJP:       findIndexByAliases(headers, COLUMN_ALIASES.epNoJP),
    title:        findIndexByAliases(headers, COLUMN_ALIASES.title),
    airDate:      findIndexByAliases(headers, COLUMN_ALIASES.airDate),
    episodeType:  findIndexByAliases(headers, COLUMN_ALIASES.episodeType),
    caseType:     findIndexByAliases(headers, COLUMN_ALIASES.caseType),
    keyCharacters:findIndexByAliases(headers, COLUMN_ALIASES.keyCharacters),
    trivia:       findIndexByAliases(headers, COLUMN_ALIASES.trivia),
    caseSummary:  findIndexByAliases(headers, COLUMN_ALIASES.caseSummary),
    mainPlot:     findIndexByAliases(headers, COLUMN_ALIASES.mainPlot),
    checklist:    findIndexByAliases(headers, COLUMN_ALIASES.checklist)
  };
}
function getCell(arr, idx){ return (idx === -1) ? '' : (arr[idx] || ''); }
function isChecked(val){
  var s = String(val || '').trim().toLowerCase();
  return (s==='true'||s==='yes'||s==='y'||s==='1'||s==='✓'||s==='✔'||s==='check'||s==='checked');
}

/* ==== ตรวจหัวตาราง (รองรับกรณีเริ่ม A5) ==== */
function detectHeaderRowIndex(arrays, maxScan){
  if (typeof maxScan !== 'number') maxScan = 12;
  var bestIdx = -1, bestScore = -1;

  function scoreRow(row){
    var score = 0;
    for (var i=0;i<row.length;i++) {
      var cell = String(row[i] || '').trim().toLowerCase();
      // เทียบกับ alias แบบ O(n) เพื่อคงความเข้ากันได้สูง (เลี่ยง Set/flat/ฯลฯ)
      for (var j=0;j<ALL_ALIAS_ARRAY.length;j++) {
        if (cell === String(ALL_ALIAS_ARRAY[j]).trim().toLowerCase()) { score++; break; }
      }
    }
    return score;
  }

  for (var r=0; r<arrays.length && r<maxScan; r++) {
    var sc = scoreRow(arrays[r] || []);
    if (sc > bestScore) { bestScore = sc; bestIdx = r; }
  }
  return (bestScore >= 2) ? bestIdx : -1;
}

/* ===================== CONAN TABLE (42 ROWS) ===================== */
function renderConanTableFromSheet(sheetId, gid) {
  var tbody = document.getElementById('conan-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="11">Loading…</td></tr>';

  gvizFetch(sheetId, gid, 'select *').then(function(json){
    var arrays = tableToArrays(json);           // แถวจริง
    var labels = extractHeadersFromCols(json);  // label จาก cols (ถ้ามี)

    var headers = [], dataRows = [];

    // 1) ใช้ labels ถ้าดูมีหัวเยอะพอ
    var nonEmpty = [];
    for (var i=0;i<labels.length;i++) if (String(labels[i]).trim()!=='') nonEmpty.push(labels[i]);

    if (nonEmpty.length >= 3) {
      headers = labels;
      dataRows = arrays;
    } else {
      // 2) หา header ภายในแถวบน ๆ (รองรับ A5)
      var idx = detectHeaderRowIndex(arrays, 12);
      if (idx !== -1) {
        headers = arrays[idx];
        dataRows = arrays.slice(idx + 1);
      } else {
        // 3) fallback: แถวแรกเป็น header
        headers = arrays[0] || [];
        dataRows = arrays.slice(1);
      }
    }

    var map = buildColumnMap(headers);
    if (!dataRows.length) { tbody.innerHTML = '<tr><td colspan="11">No data.</td></tr>'; centerConanLayout(); return; }

    var MAX_ROWS = 42;
    var rows = dataRows.slice(0, MAX_ROWS);
    while (rows.length < MAX_ROWS) rows.push([]);

    var frag = document.createDocumentFragment();
    for (var r=0;r<rows.length;r++) {
      var row = rows[r];
      var tr = document.createElement('tr');

      var tdEpTH = document.createElement('td');  tdEpTH.textContent = getCell(row, map.epNoTH);        tr.appendChild(tdEpTH);
      var tdEpJP = document.createElement('td');  tdEpJP.textContent = getCell(row, map.epNoJP);        tr.appendChild(tdEpJP);
      var tdTitle= document.createElement('td');  tdTitle.textContent= getCell(row, map.title);         tr.appendChild(tdTitle);
      var tdAir  = document.createElement('td');  tdAir.textContent  = getCell(row, map.airDate);       tr.appendChild(tdAir);
      var tdET   = document.createElement('td');  tdET.textContent   = getCell(row, map.episodeType);   tr.appendChild(tdET);
      var tdCT   = document.createElement('td');  tdCT.textContent   = getCell(row, map.caseType);      tr.appendChild(tdCT);
      var tdKC   = document.createElement('td');  tdKC.textContent   = getCell(row, map.keyCharacters); tr.appendChild(tdKC);
      var tdTv   = document.createElement('td');  tdTv.textContent   = getCell(row, map.trivia);        tr.appendChild(tdTv);
      var tdSum  = document.createElement('td');  tdSum.textContent  = getCell(row, map.caseSummary);   tr.appendChild(tdSum);
      var tdMP   = document.createElement('td');  tdMP.textContent   = getCell(row, map.mainPlot);      tr.appendChild(tdMP);

      var tdChk  = document.createElement('td');
      var span   = document.createElement('span');
      var checked= isChecked(getCell(row, map.checklist));
      span.className = 'chk' + (checked ? ' chk--on' : '');
      span.setAttribute('aria-label', checked ? 'Checked' : 'Not checked');
      tdChk.appendChild(span); tr.appendChild(tdChk);

      frag.appendChild(tr);
    }

    tbody.innerHTML = '';
    tbody.appendChild(frag);

    centerConanLayout();  // จัดกึ่งกลาง + จัดตำแหน่ง SS
  }).catch(function(err){
    tbody.innerHTML = '<tr><td colspan="11">Failed to load sheet. Please check sharing (Anyone with the link can view) or Publish to the web. (' + err.message + ')</td></tr>';
    centerConanLayout();
  });
}

/* ===================== LAYOUT HELPERS ===================== */
function viewportWidth(){
  // หลีกเลี่ยง visualViewport (บางเครื่องไม่มี)
  return (document.documentElement && document.documentElement.clientWidth) ? document.documentElement.clientWidth : window.innerWidth;
}
function centerElementToViewport(el, offsetPx){
  if (!el) return;
  if (typeof offsetPx !== 'number') offsetPx = 0;
  try {
    el.style.transform = 'translateX(0)';
    requestAnimationFrame(function(){
      var rect = el.getBoundingClientRect();
      var vpC  = viewportWidth() / 2;
      var elC  = rect.left + rect.width / 2;
      var delta= Math.round(vpC - elC + offsetPx);
      el.style.transform = 'translateX(' + delta + 'px)';
    });
  } catch(e) {}
}
function alignLeftOfAtoLeftOfB(a, b){
  if (!a || !b) return;
  try {
    a.style.transform = 'translateX(0)';
    requestAnimationFrame(function(){
      var ar = a.getBoundingClientRect();
      var br = b.getBoundingClientRect();
      var delta = Math.round(br.left - ar.left);
      a.style.transform = 'translateX(' + delta + 'px)';
    });
  } catch(e) {}
}
function centerConanLayout(){
  try {
    var titleGroup = document.querySelector('.conan-page .title-group');
    var table      = document.querySelector('.conan-page .conan-table');
    centerElementToViewport(titleGroup, 0);
    centerElementToViewport(table, 0);
    var picker = document.getElementById('season-picker');
    if (picker && table) alignLeftOfAtoLeftOfB(picker, table);
  } catch(e) {}
}

/* ===================== SEASON SELECTOR ===================== */
var SEASONS = [{ label: 'Detective Conan SS.1', gid: '0' }];

function setupSeasonPicker(sheetSection){
  var picker = document.getElementById('season-picker'); if (!picker || !sheetSection) return;
  var btn   = picker.querySelector('.season-button');
  var menu  = picker.querySelector('.season-menu');
  var label = picker.querySelector('.season-label');

  // z-index ถูกตั้งไว้ใน CSS แล้ว (ปุ่ม 3001 / เมนู 4000) เพื่อให้ทับตารางแน่นอน

  // เติมรายการ
  menu.innerHTML = '';
  for (var i=0;i<SEASONS.length;i++){
    (function(s){
      var li = document.createElement('li');
      li.textContent = s.label;
      li.setAttribute('role','option');
      li.tabIndex = 0;
      li.addEventListener('click', function(){
        label.textContent = s.label;
        sheetSection.setAttribute('data-gid', s.gid);
        renderConanTableFromSheet(sheetSection.getAttribute('data-sheet-id'), s.gid);
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      });
      menu.appendChild(li);
    })(SEASONS[i]);
  }

  // เปิด/ปิดเมนู
  btn.addEventListener('click', function(){
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    menu.hidden = expanded;
  });
  document.addEventListener('click', function(e){
    if (!picker.contains(e.target)) { menu.hidden = true; btn.setAttribute('aria-expanded','false'); }
  });
}

/* ===================== MENU & INIT ===================== */
document.addEventListener('DOMContentLoaded', function () {
  try {
    // Menu
    var menuToggle = document.querySelector('.menu-toggle');
    var sideMenu   = document.querySelector('.side-menu');
    var closeMenu  = document.querySelector('.close-menu');
    var overlay    = document.querySelector('.menu-overlay');

    function updateMenuIcon(isOpen) {
      if (!menuToggle) return;
      var icon = menuToggle.querySelector('i');
      if (icon) icon.className = isOpen ? 'fi fi-br-cross' : 'fi fi-br-menu-burger';
      else menuToggle.textContent = isOpen ? '×' : '☰';
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Toggle navigation');
    }
    function toggleMenu() {
      if (!sideMenu || !menuToggle || !overlay) return;
      var isOpen = sideMenu.classList.toggle('open');
      overlay.classList.toggle('visible', isOpen);
      updateMenuIcon(isOpen);
      sideMenu.setAttribute('aria-hidden', String(!isOpen));
    }
    if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if (closeMenu)  closeMenu.addEventListener('click', toggleMenu);
    if (overlay)    overlay.addEventListener('click', toggleMenu);
    updateMenuIcon(false);

    // Theme
    var modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) modeToggle.addEventListener('click', toggleMode);
    applyIconTheme(document.body.classList.contains('dark-mode'));

    // Home timers
    initializeUpdates();

    // Conan page
    var sheetSection = document.getElementById('conan-sheet');
    if (sheetSection) {
      setupSeasonPicker(sheetSection);
      renderConanTableFromSheet(
        sheetSection.getAttribute('data-sheet-id'),
        sheetSection.getAttribute('data-gid') || '0'
      );
    } else {
      // เผื่ออยู่หน้า Conan แต่ยังไม่วาดตาราง
      centerConanLayout();
    }
  } catch(e) {
    // ป้องกัน error ตัวเดียวล้มทั้งไฟล์
  }
});

/* อัปเดตตำแหน่งเมื่อเปลี่ยนขนาดหน้าต่าง/หมุนจอ */
window.addEventListener('resize', centerConanLayout);
window.addEventListener('orientationchange', centerConanLayout);