function toggleMode() {
    document.body.classList.toggle('dark-mode');
    const toggleCircle = document.querySelector('.toggle-circle');
    if (document.body.classList.contains('dark-mode')) {
        toggleCircle.innerHTML = '🌙';
        toggleCircle.classList.remove('light');
    } else {
        toggleCircle.innerHTML = '☀️';
        toggleCircle.classList.add('light');
    }
}

// ฟังก์ชันเพื่ออัปเดตวันที่และเวลา
function updateTime() {
    const now = new Date();
    document.getElementById('date-display').textContent = `Date: ${now.toLocaleDateString('en-GB')}`;
    document.getElementById('time-display').textContent = `Time: ${now.toLocaleTimeString('en-GB')}`;
    setTimeout(updateTime, 1000);
}

// ฟังก์ชันเพื่อคำนวณและแสดงเวลาถอยหลัง
function updateCountdown() {
    const now = new Date();
    const nextYear = new Date(`January 1, 2026 00:00:00`).getTime();
    const timeLeft = nextYear - now.getTime();
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    document.getElementById('countdown-display').textContent = `Days: ${days}, Hours: ${hours}, Minutes: ${minutes}, Seconds: ${seconds}`;
    setTimeout(updateCountdown, 1000);
}

// ฟังก์ชันเพื่อเริ่มต้นการอัปเดตเวลาและการนับถอยหลัง
function initializeUpdates() {
    updateTime();
    updateCountdown();
}

// เรียกใช้ฟังก์ชันเพื่อเริ่มต้นการอัปเดตเวลาและการนับถอยหลังเมื่อ DOM โหลดเสร็จแล้ว
document.addEventListener('DOMContentLoaded', initializeUpdates);