// js-Home-30092025-05 — time & single-number countdown
const dateEl = document.getElementById('date-display');
const timeEl = document.getElementById('time-display');
const cdEl = document.getElementById('countdown-display');

function pad(n){ return n.toString().padStart(2,'0'); }
function tick(){
  const now = new Date();
  const yyyy = now.getFullYear(), mm = pad(now.getMonth()+1), dd = pad(now.getDate());
  const hh = pad(now.getHours()), mi = pad(now.getMinutes()), ss = pad(now.getSeconds());
  if(dateEl) dateEl.textContent = `${dd}/${mm}/${yyyy}`;
  if(timeEl) timeEl.textContent = `${hh}:${mi}:${ss}`;

  const target = new Date('2026-01-01T00:00:00+07:00').getTime();
  const diffMs = Math.max(0, target - now.getTime());
  // แสดง “จำนวนวันคงเหลือ” เป็นตัวเลขเดียว
  const daysLeft = Math.floor(diffMs/86400000);
  if(cdEl) cdEl.textContent = `${daysLeft}`;
}
tick(); setInterval(tick, 1000);