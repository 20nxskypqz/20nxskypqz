/* ===== Theme toggle ===== */
const FI_DAY_HREF = 'https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-chubby/css/uicons-solid-chubby.css';
const FI_NIGHT_HREF = 'https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-rounded/css/uicons-solid-rounded.css';

function applyIconTheme(isDark) {
    const link = document.getElementById('fi-theme');
    if (link) link.setAttribute('href', isDark ? FI_NIGHT_HREF : FI_DAY_HREF);
    const icon = document.getElementById('mode-icon');
    if (icon) icon.className = isDark ? 'fi fi-sr-moon' : 'fi fi-sc-sun';
}

function toggleMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    const toggleCircle = document.querySelector('.toggle-circle');
    if (toggleCircle) {
        if (isDark) toggleCircle.classList.remove('light');
        else toggleCircle.classList.add('light');
    }
    applyIconTheme(isDark);
}

/* ===== Time / Countdown (Home page) ===== */
function updateTime() {
    const dateEl = document.getElementById('date-display');
    const timeEl = document.getElementById('time-display');
    if (!dateEl || !timeEl) return;
    const now = new Date();
    dateEl.textContent = `Date: ${now.toLocaleDateString('en-GB')}`;
    timeEl.textContent = `Time: ${now.toLocaleTimeString('en-GB')}`;
}

function updateCountdown() {
    const el = document.getElementById('countdown-display');
    if (!el) return;
    const target = new Date('January 1, 2026 00:00:00');
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) { el.textContent = '🎉 Happy New Year 2026!'; return; }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    // full words
    el.textContent = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
}

// Make sure these run (and continue running)
function initializeUpdates() {
    updateTime();
    updateCountdown();
    setInterval(updateTime, 1000);
    setInterval(updateCountdown, 1000);
}

/* ===== Sheets helpers (used by Conan page) ===== */
function gvizFetch(sheetId, gid, tq) {
    const url =
        'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(sheetId) +
        '/gviz/tq?gid=' + encodeURIComponent(gid || '0') +
        (tq ? '&tq=' + encodeURIComponent(tq) : '');
    return fetch(url).then(r => r.text()).then(txt => {
        const s = txt.indexOf('{');
        const e = txt.lastIndexOf('}');
        if (s === -1 || e === -1) throw new Error('Unexpected response format');
        return JSON.parse(txt.slice(s, e + 1));
    });
}
function rowToArray(row) {
    return (row.c || []).map(c => (c ? (c.f != null ? String(c.f) : (c.v == null ? '' : String(c.v))) : ''));
}
function tableToArrays(json) {
    const rows = json?.table?.rows || [];
    return rows.map(rowToArray);
}
const COLUMN_ALIASES = {
    epNoTH: ['Episode No TH','Episode No. (TH)','ตอนที่ (ไทย)','ตอนที่ไทย','EP TH','Ep TH','EP(TH)'],
    epNoJP: ['Episode No JP','Episode No. (JP)','ตอนที่ (ญี่ปุ่น)','ตอนที่ญี่ปุ่น','EP JP','Ep JP','EP(JP)'],
    title: ['Episode Title','ชื่อตอน','Title'],
    airDate: ['Air Date','วันออกอากาศ','Broadcast Date','On Air'],
    episodeType: ['Episode Type','ประเภทตอน'],
    caseType: ['Case Type','ประเภทคดี'],
    keyCharacters: ['Key Characters','ตัวละคร','Characters'],
    trivia: ['Trivia','เกร็ดความรู้'],
    caseSummary: ['Case Summary','สรุปคดี','Summary'],
    mainPlot: ['Main Plot Related','เนื้อเรื่องหลัก','Main Plot'],
    checklist: ['Checklist','เช็คลิสต์','Check']
};
function normalizeHeader(h){ return String(h || '').trim().toLowerCase(); }
function findIndexByAliases(headers, aliases){
    const norm = headers.map(normalizeHeader);
    for (const a of aliases) {
        const idx = norm.indexOf(a.trim().toLowerCase());
        if (idx !== -1) return idx;
    }
    return -1;
}
function buildColumnMap(headerRow){
    const map = {}, headers = headerRow || [];
    map.epNoTH      = findIndexByAliases(headers, COLUMN_ALIASES.epNoTH);
    map.epNoJP      = findIndexByAliases(headers, COLUMN_ALIASES.epNoJP);
    map.title       = findIndexByAliases(headers, COLUMN_ALIASES.title);
    map.airDate     = findIndexByAliases(headers, COLUMN_ALIASES.airDate);
    map.episodeType = findIndexByAliases(headers, COLUMN_ALIASES.episodeType);
    map.caseType    = findIndexByAliases(headers, COLUMN_ALIASES.caseType);
    map.keyCharacters = findIndexByAliases(headers, COLUMN_ALIASES.keyCharacters);
    map.trivia      = findIndexByAliases(headers, COLUMN_ALIASES.trivia);
    map.caseSummary = findIndexByAliases(headers, COLUMN_ALIASES.caseSummary);
    map.mainPlot    = findIndexByAliases(headers, COLUMN_ALIASES.mainPlot);
    map.checklist   = findIndexByAliases(headers, COLUMN_ALIASES.checklist);
    return map;
}
function getCell(arr, idx){ return idx === -1 ? '' : (arr[idx] || ''); }
function isChecked(val){
    const s = String(val || '').trim().toLowerCase();
    return ['true','yes','y','1','✓','✔','check','checked'].includes(s);
}

/* ===== Conan table rendering (42 rows) ===== */
function renderConanTableFromSheet(sheetId, gid) {
    const tbody = document.getElementById('conan-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="11">Loading…</td></tr>';

    gvizFetch(sheetId, gid, 'select *').then(json => {
        const arrays = tableToArrays(json);
        if (!arrays.length) { tbody.innerHTML = '<tr><td colspan="11">No data.</td></tr>'; return; }
        const header = arrays[0];
        const dataRows = arrays.slice(1);
        const map = buildColumnMap(header);

        const MAX_ROWS = 42;
        const rows = dataRows.slice(0, MAX_ROWS);
        while (rows.length < MAX_ROWS) rows.push([]);

        const frag = document.createDocumentFragment();
        rows.forEach(row => {
            const tr = document.createElement('tr');

            const tdEpTH = document.createElement('td');   tdEpTH.textContent = getCell(row, map.epNoTH);       tr.appendChild(tdEpTH);
            const tdEpJP = document.createElement('td');   tdEpJP.textContent = getCell(row, map.epNoJP);       tr.appendChild(tdEpJP);
            const tdTitle = document.createElement('td');  tdTitle.textContent = getCell(row, map.title);       tr.appendChild(tdTitle);
            const tdAir = document.createElement('td');    tdAir.textContent = getCell(row, map.airDate);       tr.appendChild(tdAir);
            const tdEpType = document.createElement('td'); tdEpType.textContent = getCell(row, map.episodeType);tr.appendChild(tdEpType);
            const tdCaseType = document.createElement('td'); tdCaseType.textContent = getCell(row, map.caseType);tr.appendChild(tdCaseType);
            const tdChars = document.createElement('td');  tdChars.textContent = getCell(row, map.keyCharacters);tr.appendChild(tdChars);
            const tdTrivia = document.createElement('td'); tdTrivia.textContent = getCell(row, map.trivia);      tr.appendChild(tdTrivia);
            const tdSummary = document.createElement('td');tdSummary.textContent = getCell(row, map.caseSummary);tr.appendChild(tdSummary);
            const tdMainPlot = document.createElement('td'); tdMainPlot.textContent = getCell(row, map.mainPlot);tr.appendChild(tdMainPlot);

            const tdChecklist = document.createElement('td');
            const span = document.createElement('span');
            const checked = isChecked(getCell(row, map.checklist));
            span.className = 'chk' + (checked ? ' chk--on' : '');
            span.setAttribute('aria-label', checked ? 'Checked' : 'Not checked');
            tdChecklist.appendChild(span);
            tr.appendChild(tdChecklist);

            frag.appendChild(tr);
        });

        tbody.innerHTML = '';
        tbody.appendChild(frag);
    }).catch(err => {
        tbody.innerHTML = '<tr><td colspan="11">Failed to load sheet. Please check sharing (Anyone with the link can view) or Publish to the web. (' + err.message + ')</td></tr>';
    });
}

/* ===== Season selector (Conan) ===== */
const SEASONS = [
    { label: 'Detective Conan SS.1', gid: '0' }
];
function setupSeasonPicker(sheetSection) {
    const picker = document.getElementById('season-picker');
    if (!picker || !sheetSection) return;
    const btn = picker.querySelector('.season-button');
    const menu = picker.querySelector('.season-menu');
    const labelSpan = picker.querySelector('.season-label');

    menu.innerHTML = '';
    SEASONS.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s.label;
        li.setAttribute('role','option');
        li.tabIndex = 0;
        li.addEventListener('click', () => {
            labelSpan.textContent = s.label;
            sheetSection.setAttribute('data-gid', s.gid);
            renderConanTableFromSheet(sheetSection.getAttribute('data-sheet-id'), s.gid);
            menu.hidden = true;
            btn.setAttribute('aria-expanded','false');
        });
        menu.appendChild(li);
    });

    btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        menu.hidden = expanded;
    });
    document.addEventListener('click', (e) => {
        if (!picker.contains(e.target)) {
            menu.hidden = true;
            btn.setAttribute('aria-expanded','false');
        }
    });
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', function () {
    // Menu (only on pages that have it)
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

    // Ensure correct icon on load
    updateMenuIcon(false);

    // Theme
    var modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) modeToggle.addEventListener('click', toggleMode);

    // Apply correct icon set on load
    applyIconTheme(document.body.classList.contains('dark-mode'));

    // Home timers
    initializeUpdates();

    // Conan
    var sheetSection = document.getElementById('conan-sheet');
    if (sheetSection) {
        setupSeasonPicker(sheetSection);
        renderConanTableFromSheet(
            sheetSection.getAttribute('data-sheet-id'),
            sheetSection.getAttribute('data-gid') || '0'
        );
    }
});