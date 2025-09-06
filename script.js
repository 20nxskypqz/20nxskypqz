/* ===== Theme toggle ===== */
const FI_DAY_HREF = 'https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-chubby/css/uicons-solid-chubby.css';
const FI_NIGHT_HREF = 'https://cdn-uicons.flaticon.com/3.0.0/uicons-solid-rounded/css/uicons-solid-rounded.css';

function applyIconTheme(isDark) {
    const link = document.getElementById('fi-theme');
    if (link) link.setAttribute('href', isDark ? FI_NIGHT_HREF : FI_DAY_HREF);
    const icon = document.getElementById('mode-icon');
    if (icon) {
        icon.className = isDark ? 'fi fi-sr-moon' : 'fi fi-sc-sun';
    }
}

function toggleMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    const toggleCircle = document.querySelector('.toggle-circle');
    if (toggleCircle) {
        if (isDark) {
            toggleCircle.classList.remove('light');
        } else {
            toggleCircle.classList.add('light');
        }
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
    if (diff <= 0) {
        el.textContent = '🎉 Happy New Year 2026!';
        return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    el.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
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
        if (idx !== -1)