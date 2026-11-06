/* Main Restora interface. */
const $ = id => document.getElementById(id);
const localDateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const todayKey = () => localDateKey(new Date());
let calendarCursor = new Date(); calendarCursor.setDate(1);
let selectedCalendarDate = todayKey();
let toastTimer;

function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}
function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[ch]));
}
function dateLabel(key, options={weekday:"short",day:"numeric",month:"short",year:"numeric"}) {
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, options);
}
function entries() { return Storage.entries(); }
function entryFor(date) { return entries().find(e => e.date === date); }
function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === `view-${name}`));
  document.querySelectorAll(".nav-link[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  const titles = { overview:"Good to see you.", calendar:"Your sleep calendar", journal:"Your sleep journal", planner:"Plan a better routine." };
  $("pageTitle").textContent = titles[name] || "Restora";
  if (name === "calendar") renderCalendar();
  if (name === "journal") renderJournal();
  if (name === "planner") renderPlanner();
  $("sidebar").classList.remove("open");
}
function openSleepDialog(entry=null) {
  $("sleepForm").reset(); $("formError").textContent = "";
  $("entryId").value = entry?.id || "";
  $("sleepDialogTitle").textContent = entry ? "Edit your night" : "Add a night";
  $("sleepDate").value = entry?.date || todayKey();
  $("bedTime").value = entry?.bed || "23:00"; $("wakeTime").value = entry?.wake || "07:00";
  $("rested").value = entry?.rested || "Okay"; $("factor").value = entry?.factor || "No specific factor";
  $("entryNote").value = entry?.note || "";
  $("sleepDialog").showModal();
}
function renderOverview() {
  const all = entries(), today = new Date(); today.setHours(0,0,0,0);
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate()-6);
  const recent = all.filter(e => new Date(`${e.date}T12:00:00`) >= weekAgo && new Date(`${e.date}T12:00:00`) <= today);
  const settings = Storage.settings(), avg = recent.length ? recent.reduce((s,e)=>s+e.duration,0)/recent.length : null;
  $("avgSleep").textContent = avg == null ? "—" : SleepCalculator.formatHours(avg);
  $("goalProgress").textContent = avg == null ? "—" : `${Math.round(avg/settings.goal*100)}%`;
  $("goalCaption").textContent = `of your ${settings.goal}-hour goal`;
  $("trackedNights").textContent = recent.length;
  const shortfall = recent.reduce((s,e)=>s+Math.max(0,settings.goal-e.duration),0);
  $("sleepDebt").textContent = recent.length ? SleepCalculator.formatHours(shortfall) : "—";
  $("insightContent").innerHTML = `<div class="insight-symbol">✧</div><p>${escapeHTML(Analytics.insight(recent,settings.goal))}</p>`;
  renderRecent();
  const range = Number($("chartRange").value || 7);
  Analytics.draw(all,range,Number(settings.goal));
}
function renderRecent() {
  const rows = entries().slice(0,6);
  $("recentTable").innerHTML = rows.length ? rows.map(e => `<tr>
    <td>${dateLabel(e.date)}</td><td>${SleepCalculator.displayTime(e.bed)}</td><td>${SleepCalculator.displayTime(e.wake)}</td>
    <td><strong>${SleepCalculator.formatHours(e.duration)}</strong></td><td>${escapeHTML(e.rested || "—")}</td>
    <td><button class="table-action" data-edit="${e.id}">Edit</button><button class="table-action delete" data-delete="${e.id}">Delete</button></td></tr>`).join("") : `<tr><td colspan="6" class="empty-cell">No sleep entries yet. Add your first night to get started.</td></tr>`;
}
function renderCalendar() {
  const year=calendarCursor.getFullYear(), month=calendarCursor.getMonth();
  $("monthTitle").textContent = calendarCursor.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  const first = new Date(year,month,1), start = new Date(year,month,1-first.getDay());
  const all = entries(); let html="";
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i); const key=localDateKey(d);
    const entry=all.find(e=>e.date===key), outside=d.getMonth()!==month;
    html += `<button class="calendar-day ${outside?"muted-day":""} ${key===todayKey()?"today":""} ${key===selectedCalendarDate?"selected":""}" data-date="${key}">
      <span class="day-number">${d.getDate()}</span>${entry?`<span class="day-duration">${SleepCalculator.formatHours(entry.duration)}</span>`:""}
    </button>`;
  }
  $("calendarDays").innerHTML=html; renderSelectedDay();
}
function renderSelectedDay() {
  const entry=entryFor(selectedCalendarDate);
  $("selectedDayTitle").textContent=dateLabel(selectedCalendarDate,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  if(!entry){$("selectedDayText").innerHTML=`No sleep entry for this date. <button class="text-button" id="addSelectedDay">Add an entry →</button>`;return;}
  $("selectedDayText").innerHTML=`<strong>${SleepCalculator.formatHours(entry.duration)}</strong> slept · ${SleepCalculator.displayTime(entry.bed)} to ${SleepCalculator.displayTime(entry.wake)}<br><span class="muted">${escapeHTML(entry.rested || "")} · ${escapeHTML(entry.factor || "")}</span>${entry.note?`<br>${escapeHTML(entry.note)}`:""}<br><button class="text-button" id="editSelectedDay">Edit entry →</button> <button class="text-button danger-text" id="deleteSelectedDay">Delete entry</button>`;
}
function renderJournal() {
  $("journalDate").value = todayKey();
  const notes=Storage.journal();
  $("journalList").innerHTML=notes.length?notes.map(n=>`<article class="journal-item"><strong>${dateLabel(n.date)} · ${escapeHTML(n.feeling)}</strong><p>${escapeHTML(n.factor)}${n.note?` — ${escapeHTML(n.note)}`:""}</p></article>`).join(""):`<p class="muted">Your saved notes will show up here.</p>`;
}
function renderPlanner() {
  const s=Storage.settings(); $("sleepGoal").value=String(s.goal); $("targetWake").value=s.wake; $("fallAsleep").value=String(s.latency);
  const options=SleepCalculator.bedtimeOptions(s.wake,Number(s.goal),Number(s.latency));
  $("bedtimeResults").innerHTML=options.map((o,i)=>`<div class="bedtime-option"><div><strong>${SleepCalculator.displayTime(o.time)}</strong><br><span>${o.label} · ${o.duration} hours in bed*</span></div><span>${i===0?"Your plan":"Alternative"}</span></div>`).join("");
}
function applyTheme(theme) {
  document.documentElement.dataset.theme=theme;
  Storage.updateSettings({theme});
  $("themeToggle").innerHTML=`<span>◐</span> ${theme==="dark"?"Switch to light":"Switch to dark"}`;
}
function download(filename,content,type) {
  const blob=new Blob([content],{type}), url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
function exportCSV() {
  const rows=entries(); if(!rows.length){toast("There are no sleep entries to export yet.");return;}
  const columns=["date","bed","wake","duration_hours","rested","factor","note"];
  const csv=[columns.join(","),...rows.map(e=>columns.map(k=>`"${String(k==="duration_hours"?e.duration:e[k]??"").replace(/"/g,'""')}"`).join(","))].join("\n");
  download("restora-sleep-logs.csv",csv,"text/csv;charset=utf-8"); toast("CSV export ready.");
}
function exportJSON() { download("restora-backup.json",JSON.stringify(Storage.getAll(),null,2),"application/json");toast("Backup file created."); }
function validateDateTime(date,bed,wake) {
  if(!date||!bed||!wake) return "Please complete the date, bedtime and wake-up time.";
  if(SleepCalculator.duration(bed,wake)<=0 || SleepCalculator.duration(bed,wake)>18) return "Please check the times. Sleep duration must be under 18 hours.";
  return "";
}
document.addEventListener("DOMContentLoaded",()=>{
  $("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
  applyTheme(Storage.settings().theme || "light");
  document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
  ["quickAdd","welcomeLog"].forEach(id=>$(id).addEventListener("click",()=>openSleepDialog()));
  $("closeDialog").addEventListener("click",()=>$("sleepDialog").close());
  $("cancelDialog").addEventListener("click",()=>$("sleepDialog").close());
  $("sleepForm").addEventListener("submit",e=>{
    e.preventDefault();
    const date=$("sleepDate").value,bed=$("bedTime").value,wake=$("wakeTime").value,error=validateDateTime(date,bed,wake);
    if(error){$("formError").textContent=error;return;}
    const id=$("entryId").value || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    Storage.saveEntry({id,date,bed,wake,duration:Number(SleepCalculator.duration(bed,wake).toFixed(2)),rested:$("rested").value,factor:$("factor").value,note:$("entryNote").value.trim()});
    $("sleepDialog").close(); renderOverview(); renderCalendar(); toast("Sleep entry saved.");
  });
  document.addEventListener("click",e=>{
    const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]");
    if(edit){const item=entries().find(x=>x.id===edit.dataset.edit);if(item)openSleepDialog(item);}
    if(del && confirm("Delete this sleep entry?")){Storage.deleteEntry(del.dataset.delete);renderOverview();renderCalendar();toast("Entry deleted.");}
    const day=e.target.closest("[data-date]");if(day){selectedCalendarDate=day.dataset.date;renderCalendar();}
    if(e.target.id==="addSelectedDay")openSleepDialog({date:selectedCalendarDate});
    if(e.target.id==="editSelectedDay"){const item=entryFor(selectedCalendarDate);if(item)openSleepDialog(item);}
    if(e.target.id==="deleteSelectedDay" && confirm("Delete this sleep entry?")){const item=entryFor(selectedCalendarDate);if(item)Storage.deleteEntry(item.id);renderCalendar();renderOverview();toast("Entry deleted.");}
  });
  $("prevMonth").addEventListener("click",()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar();});
  $("nextMonth").addEventListener("click",()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar();});
  $("chartRange").addEventListener("change",renderOverview);
  $("themeToggle").addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
  $("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
  $("exportCsv").addEventListener("click",exportCSV);$("exportJson").addEventListener("click",exportJSON);
  $("importJson").addEventListener("change",async e=>{
    const file=e.target.files[0];if(!file)return;
    try{Storage.replace(JSON.parse(await file.text()));renderOverview();renderCalendar();renderJournal();renderPlanner();toast("Backup restored.");}
    catch(err){alert(err.message || "Could not read that backup file.");}
    e.target.value="";
  });
  $("resetData").addEventListener("click",()=>{if(confirm("This will remove all Restora entries and settings saved in this browser. Continue?")){Storage.clear();applyTheme("light");renderAll();renderCalendar();renderJournal();renderPlanner();toast("Your local data has been reset.");}});
  $("journalForm").addEventListener("submit",e=>{
    e.preventDefault();Storage.saveJournal({date:$("journalDate").value,feeling:$("restedFeeling").value,factor:$("sleepFactors").value,note:$("journalNote").value.trim()});
    $("journalNote").value="";renderJournal();toast("Journal note saved.");
  });
  $("goalForm").addEventListener("submit",e=>{
    e.preventDefault();Storage.updateSettings({goal:Number($("sleepGoal").value),wake:$("targetWake").value,latency:Number($("fallAsleep").value)});
    renderPlanner();renderOverview();toast("Your sleep plan was updated.");
  });
  renderAll();renderCalendar();renderJournal();renderPlanner();
});
function renderAll(){renderOverview();}
