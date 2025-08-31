function toggleMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    const toggleCircle = document.querySelector('.toggle-circle');
    if (isDark) {
        toggleCircle.innerHTML = '🌙';
        toggleCircle.classList.remove('light');
    } else {
        toggleCircle.innerHTML = '☀️';
        toggleCircle.classList.add('light');
    }
}

function updateTime() {
    const now = new Date();
    document.getElementById('date-display').textContent = `Date: ${now.toLocaleDateString('en-GB')}`;
    document.getElementById('time-display').textContent = `Time: ${now.toLocaleTimeString('en-GB')}`;
    setTimeout(updateTime, 1000);
}

function updateCountdown() {
    const now = new Date();
    const nextYear = new Date('January 1, 2026 00:00:00').getTime();
    const timeLeft = nextYear - now.getTime();
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    document.getElementById('countdown-display').textContent = `Days: ${days}, Hours: ${hours}, Minutes: ${minutes}, Seconds: ${seconds}`;
    setTimeout(updateCountdown, 1000);
}

function initializeUpdates() {
    updateTime();
    updateCountdown();
}

document.addEventListener('DOMContentLoaded', () => {
    initializeUpdates();

    const menuToggle = document.querySelector('.menu-toggle');
    const sideMenu = document.querySelector('.side-menu');
    const closeMenu = document.querySelector('.close-menu');
    const toggleMenu = () => {
        const isOpen = sideMenu.classList.toggle('open');
        if (menuToggle) {
            menuToggle.innerHTML = isOpen ? '&times;' : '&#9776;';
        }
    };
    if (menuToggle && sideMenu) {
        menuToggle.addEventListener('click', toggleMenu);
    }
    if (closeMenu) {
        closeMenu.addEventListener('click', toggleMenu);
    }

    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
        modeToggle.addEventListener('click', toggleMode);
    }
});
