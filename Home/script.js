// js-Home-30092025-08 — time & countdown (full units) + 20px via CSS
const dateEl = document.getElementById('date-display');
const timeEl = document.getElementById('time-display');
const cdEl = document.getElementById('countdown-display');

function pad(n){ return n.toString().padStart(2,'0'); }

function tick(){
  const now = new Date();

  // Date/Time (TH)
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mi = pad(now.getMinutes());
  const ss = pad(now.getSeconds());

  if (dateEl) dateEl.textContent = `${dd}/${mm}/${yyyy}`;
  if (timeEl) timeEl.textContent = `${hh}:${mi}:${ss}`;

  // Countdown to 2026-01-01 00:00:00 +07:00
  const target = new Date('2026-01-01T00:00:00+07:00').getTime();
  const diff = Math.max(0, target - now.getTime());

  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  const secs  = Math.floor((diff % 60000) / 1000);

  if (cdEl) cdEl.textContent = `${days} days ${hours} hours ${mins} minutes ${secs} seconds`;
}

tick();
setInterval(tick, 1000);