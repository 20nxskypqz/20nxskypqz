document.addEventListener("DOMContentLoaded", () => {
    const dayNightToggle = document.getElementById("dayNightToggle");

    dayNightToggle.addEventListener("click", () => {
        dayNightToggle.classList.toggle("night");
        const isNight = dayNightToggle.classList.contains("night");
        document.body.style.backgroundColor = isNight ? "hsl(219, 30%, 12%)" : "hsl(219, 30%, 88%)";
        document.body.style.color = isNight ? "hsl(219, 30%, 98%)" : "hsl(219, 30%, 20%)";
    });
});