document.addEventListener("DOMContentLoaded", () => {
    const dayNightToggle = document.getElementById("dayNightToggle");

    dayNightToggle.addEventListener("click", () => {
        dayNightToggle.classList.toggle("night");
        const isNight = dayNightToggle.classList.contains("night");
        document.body.style.backgroundColor = isNight ? "var(--bg-dark)" : "var(--bg-light)";
        document.body.style.color = isNight ? "var(--color-dark)" : "var(--color-light)";
    });
});
