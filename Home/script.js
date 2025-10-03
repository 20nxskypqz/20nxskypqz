/* Home-JavaScript-03102025-[Complete] */
(function(){
  const pad2 = (n)=> String(n).padStart(2,'0');

  function updateTime(){
    const now = new Date();
    const tz = 'Asia/Bangkok';
    const fmtDate = new Intl.DateTimeFormat('en-GB', { timeZone: tz, dateStyle: 'full' }).format(now);
    const fmtTime = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
    const el = document.getElementById('current-time');
    if (el) el.textContent = `${fmtDate} ${fmtTime}`;
  }

  function updateCountdown(){
    const target = new Date('2026-01-01T00:00:00+07:00').getTime();
    const now = Date.now();
    let diff = Math.max(0, target - now);

    const d = Math.floor(diff / (1000*60*60*24)); diff -= d*(1000*60*60*24);
    const h = Math.floor(diff / (1000*60*60));     diff -= h*(1000*60*60);
    const m = Math.floor(diff / (1000*60));        diff -= m*(1000*60);
    const s = Math.floor(diff / 1000);

    const el = document.getElementById('countdown-display');
    if (el) el.textContent = `${d} Days ${pad2(h)} Hours ${pad2(m)} Minutes ${pad2(s)} Seconds`;
  }

  const onReady = () => {
    updateTime();
    updateCountdown();
    setInterval(updateTime, 1000);
    setInterval(updateCountdown, 1000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();