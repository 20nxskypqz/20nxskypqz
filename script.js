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