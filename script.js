const button = document.querySelector(".toggle");
const sync = document.querySelector("#sync");

// ฟังก์ชันเปลี่ยนโหมด
const toggleDarkMode = () => {
    const isPressed = button.getAttribute("aria-pressed") === "true";
    const newMode = isPressed ? "false" : "true";

    if (sync.checked) {
        document.body.setAttribute("data-dark-mode", newMode);
    }
    button.setAttribute("aria-pressed", newMode);
};

// คลิกที่ปุ่มแล้วเปลี่ยนโหมด
button.addEventListener("click", toggleDarkMode);

// ฟังก์ชันเปิด/ปิดเมนู
function toggleMenu() {
    document.body.classList.toggle("menu-open");
}