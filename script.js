// ฟังก์ชันสลับโหมดกลางวัน/กลางคืน
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');

    // บันทึกสถานะโหมดใน localStorage
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
}

// ฟังก์ชันเปิด/ปิดเมนูนำทาง
function toggleMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.toggle('show');
}

// ฟังก์ชันปิดเมนู (ใช้เมื่อคลิกลิงก์ในเมนู)
function closeMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.remove('show');
}

// ตรวจสอบและตั้งค่าโหมดเมื่อโหลดหน้าเว็บ
window.onload = function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
   0