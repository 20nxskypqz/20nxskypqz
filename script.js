function toggleMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    const toggleCircle = document.querySelector('.toggle-circle');
    if (toggleCircle) {
        if (isDark) {
            toggleCircle.textContent = '🌙';
            toggleCircle.classList.remove('light');
        } else {
            toggleCircle.textContent = '☀️';
            toggleCircle.classList.add('light');
        }
    }
}

// === Time / Countdown (used on Home page) ===
function updateTime() {
    const dateEl = document.getElementById('date-display');
    const timeEl = document.getElementById('time-display');
    if (!dateEl || !timeEl) return;
    const now = new Date();
    // keep existing behavior (viewer timezone, en-GB formatting)
    dateEl.textContent = now.toLocaleDateString('en-GB');
    timeEl.textContent = now.toLocaleTimeString('en-GB');
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
    el.textContent = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
}

function initializeUpdates() {
    // run once then every second (only updates elements that exist on the page)
    updateTime();
    updateCountdown();
    setInterval(updateTime, 1000);
    setInterval(updateCountdown, 1000);
}

// === Google Sheet fetch (used on Conan page) ===
function fetchConanSheetAsText(sheetId, gid) {
    const output = document.getElementById('conan-sheet-output');
    if (!output || !sheetId) return;

    // Use Google Visualization API (GViz) endpoint. Must be publicly viewable or published.
    const url = 'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(sheetId) +
                '/gviz/tq?gid=' + encodeURIComponent(gid || '0') +
                '&tq=' + encodeURIComponent('select *');

    fetch(url)
        .then(function(resp) { return resp.text(); })
        .then(function(txt) {
            // GViz returns a JS function call; extract the JSON object within.
            var start = txt.indexOf('{');
            var end = txt.lastIndexOf('}');
            if (start === -1 || end === -1) {
                throw new Error('Unexpected response format');
            }
            var json = JSON.parse(txt.slice(start, end + 1));
            if (!json.table || !json.table.rows) {
                throw new Error('No table data found');
            }
            var rows = json.table.rows;
            if (!rows.length) {
                output.textContent = 'No data.';
                return;
            }
            var ul = document.createElement('ul');
            rows.forEach(function(r) {
                var cells = (r.c || []).map(function(c) {
                    return (c && c.v != null) ? String(c.v) : '';
                }).filter(function(s) { return s !== ''; });
                if (!cells.length) return;
                var li = document.createElement('li');
                li.textContent = cells.join(' | ');
                ul.appendChild(li);
            });
            output.innerHTML = '';
            output.appendChild(ul);
        })
        .catch(function(err) {
            output.textContent = 'Failed to load sheet. ' +
                'Please make sure the sheet is shared as "Anyone with the link can view" ' +
                'or use File → Share → Publish to the web.\n(' + err.message + ')';
        });
}

document.addEventListener('DOMContentLoaded', function() {
    // Menu open/close (pages that have it)
    var menuToggle = document.querySelector('.menu-toggle');
    var sideMenu = document.querySelector('.side-menu');
    var closeMenu = document.querySelector('.close-menu');
    var overlay = document.querySelector('.menu-overlay');

    function toggleMenu() {
        if (!sideMenu || !menuToggle || !overlay) return;
        var isOpen = sideMenu.classList.toggle('open');
        overlay.classList.toggle('visible', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        sideMenu.setAttribute('aria-hidden', String(!isOpen));
    }

    if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if (closeMenu) closeMenu.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', toggleMenu);

    // Theme toggle (all pages)
    var modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) modeToggle.addEventListener('click', toggleMode);

    // Start time/countdown loops (safe on all pages)
    initializeUpdates();

    // If this is the Conan page and it declares a sheet, fetch it
    var sheetSection = document.getElementById('conan-sheet');
    if (sheetSection) {
        var sheetId = sheetSection.getAttribute('data-sheet-id');
        var gid = sheetSection.getAttribute('data-gid') || '0';
        fetchConanSheetAsText(sheetId, gid);
    }
});