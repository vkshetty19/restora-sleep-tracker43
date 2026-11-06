/* Chart and simple observations derived only from logged sleep duration. */
const Analytics = (() => {
  let chart;
  function draw(entries, days, goal) {
    const canvas = document.getElementById("sleepChart");
    if (!canvas || typeof Chart === "undefined") return;
    const today = new Date(); today.setHours(0,0,0,0);
    const labels = [], values = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const key = localDateKey(d);
      const entry = entries.find(e => e.date === key);
      labels.push(days === 7 ? d.toLocaleDateString(undefined,{weekday:"short"}) : d.toLocaleDateString(undefined,{day:"numeric",month:"short"}));
      values.push(entry ? Number(entry.duration.toFixed(2)) : null);
    }
    if (chart) chart.destroy();
    chart = new Chart(canvas, {
      type: "bar",
      data: { labels, datasets: [
        { label: "Hours slept", data: values, backgroundColor: "#a69acb", borderRadius: 6, maxBarThickness: 25 },
        { label: "Sleep goal", type: "line", data: labels.map(() => goal), borderColor: "#d59a73", borderDash: [5,5], pointRadius: 0, borderWidth: 2, tension: 0 }
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.raw == null ? "No entry" : `${ctx.raw} hours` } } },
        scales: {
          x: { grid: { display:false }, ticks: { color: getComputedStyle(document.body).getPropertyValue("--muted"), maxTicksLimit: 10 } },
          y: { beginAtZero:true, suggestedMax: Math.max(10, goal + 1), ticks: { stepSize:2, color:getComputedStyle(document.body).getPropertyValue("--muted") }, grid: { color: getComputedStyle(document.body).getPropertyValue("--line") } }
        }
      }
    });
    document.getElementById("chartEmpty").style.display = entries.length ? "none" : "grid";
  }
  function insight(entries, goal) {
    if (!entries.length) return "Your sleep insights will appear after you add a few entries.";
    const recent = entries.slice().sort((a,b) => b.date.localeCompare(a.date)).slice(0,7);
    const avg = recent.reduce((s,e) => s + e.duration,0) / recent.length;
    if (recent.length < 3) return "Add a few more nights to start noticing patterns in your sleep routine.";
    if (avg >= goal) return `Across your last ${recent.length} logged nights, you averaged ${avg.toFixed(1)} hours. That's around or above your current ${goal}-hour goal.`;
    return `Across your last ${recent.length} logged nights, you averaged ${avg.toFixed(1)} hours — ${(goal-avg).toFixed(1)} hours below your current goal. Consider reviewing your schedule and making room for more rest.`;
  }
  return { draw, insight };
})();
