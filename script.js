document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.getElementById("toggle-btn");
    const body = document.body;

    // ตรวจสอบว่ามีการบันทึกโหมดใน Local Storage หรือไม่
    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
    } else {
        body.classList.add("light-mode");
    }

    toggleButton.addEventListener("click", function () {
        body.classList.toggle("dark-mode");
        body.classList.toggle("light-mode");
        
        // บันทึกสถานะปัจจุบันลงใน Local Storage
        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("theme", "dark");
        } else {
            localStorage.setItem("theme", "light");
        }
    });
});