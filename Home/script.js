// js-Home-30092025-03 — time & countdown only
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
  const diff = Math.max(0, target - now.getTime());
  const d = Math.floor(diff/86400000);
  const h = Math.floor((diff%86400000)/3600000);
  const m = Math.floor((diff%3600000)/60000);
  const s = Math.floor((diff%60000)/1000);
  if(cdEl) cdEl.textContent = `${d} days ${h} hours ${m} minutes ${s} seconds`;
}
tick(); setInterval(tick, 1000);