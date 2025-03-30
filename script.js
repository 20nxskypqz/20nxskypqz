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
    const options = {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const localTime = now.toLocaleTimeString('en-GB', options);
    const dateFormatted = now.toLocaleDateString('en-GB', { timeZone: 'Asia/Bangkok' });
    document.getElementById('date-display').textContent = `Date: ${dateFormatted}`;
    document.getElementById('time-display').textContent = `Time: ${localTime}`;
    requestAnimationFrame(updateTime);
}

// ฟังก์ชันเพื่อคำนวณและแสดงเวลาถอยหลัง
function updateCountdown() {
    const now = new Date();
    const nextYear = now.getFullYear() + 1;
    const newYear = new Date(`January 1, ${nextYear} 00:00:00`).getTime();
    const timeLeft = newYear - now.getTime();

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    document.getElementById('countdown-display').textContent = `Days: ${days}, Hours: ${hours}, Minutes: ${minutes}, Seconds: ${seconds}`;
    requestAnimationFrame(updateCountdown);
}