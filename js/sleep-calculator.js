/* Sleep duration and bedtime planning calculations. */
const SleepCalculator = {
  duration(bed, wake) {
    if (!bed || !wake) return 0;
    const [bh,bm] = bed.split(":").map(Number);
    const [wh,wm] = wake.split(":").map(Number);
    let start = bh * 60 + bm, end = wh * 60 + wm;
    if (end <= start) end += 1440;
    return (end - start) / 60;
  },
  formatHours(hours) {
    if (!Number.isFinite(hours)) return "—";
    const total = Math.round(hours * 60);
    return `${Math.floor(total / 60)}h ${total % 60}m`;
  },
  timeFromMinutes(minutes) {
    const value = ((minutes % 1440) + 1440) % 1440;
    return `${String(Math.floor(value / 60)).padStart(2,"0")}:${String(value % 60).padStart(2,"0")}`;
  },
  displayTime(value) {
    if (!value) return "—";
    const [h,m] = value.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    return `${String(h % 12 || 12).padStart(2,"0")}:${String(m).padStart(2,"0")} ${suffix}`;
  },
  bedtimeOptions(wake, goal, latency) {
    if (!wake) return [];
    const [h,m] = wake.split(":").map(Number);
    const wakeMinutes = h * 60 + m;
    return [goal, Math.max(6, goal - 0.5), goal + 0.5].map((duration, index) => ({
      duration, label: index === 0 ? "Your selected goal" : index === 1 ? "A little earlier" : "A little later",
      time: this.timeFromMinutes(wakeMinutes - duration * 60 - latency)
    }));
  }
};
