function toggleMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    const toggleCircle = document.querySelector('.toggle-circle');
    if (isDark) {
        toggleCircle.textContent = '🌙';
        toggleCircle.classList.remove('light');
    } else {
        toggleCircle.textContent = '☀️';
        toggleCircle.classList.add('light');
    }
}

function updateTime() {
    const dateEl = document.getElementById('date-display');
    const timeEl = document.getElementById('time-display');
    if (!dateEl || !timeEl) return;
    const now = new Date();
    dateEl.textContent = `Date: ${now.toLocaleDateString('en-GB')}`;
    timeEl.textContent = `Time: ${now.toLocaleTimeString('en-GB')}`;
}

function updateCountdown() {
    const countdownEl = document.getElementById('countdown-display');
    if (!countdownEl) return;
    const now = new Date();
    const nextYear = new Date('January 1, 2026 00:00:00').getTime();
    const timeLeft = nextYear - now.getTime();
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    countdownEl.textContent = `Days: ${days}, Hours: ${hours}, Minutes: ${minutes}, Seconds: ${seconds}`;
}

function initializeUpdates() {
    updateTime();
    updateCountdown();
    setInterval(updateTime, 1000);
    setInterval(updateCountdown, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeUpdates();

    const menuToggle = document.querySelector('.menu-toggle');
    const sideMenu = document.querySelector('.side-menu');
    const closeMenu = document.querySelector('.close-menu');
    const overlay = document.querySelector('.menu-overlay');
    const toggleMenu = () => {
        const isOpen = sideMenu.classList.toggle('open');
        if (menuToggle) {
            menuToggle.textContent = isOpen ? '×' : '☰';
            menuToggle.setAttribute('aria-expanded', isOpen);
        }
        sideMenu.setAttribute('aria-hidden', !isOpen);
        if (overlay) {
            overlay.classList.toggle('visible', isOpen);
        }
    };
    if (menuToggle && sideMenu) {
        menuToggle.addEventListener('click', toggleMenu);
    }
    if (closeMenu) {
        closeMenu.addEventListener('click', toggleMenu);
    }
    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
        modeToggle.addEventListener('click', toggleMode);
    }
});
