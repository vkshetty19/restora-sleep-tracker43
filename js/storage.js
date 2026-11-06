/* Local browser storage helpers for Restora. */
const Storage = (() => {
  const KEY = "restora_data_v1";
  const defaults = { entries: [], journal: [], settings: { goal: 8, wake: "07:00", latency: 15, theme: "light" } };
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (!saved || typeof saved !== "object") return structuredClone(defaults);
      return {
        entries: Array.isArray(saved.entries) ? saved.entries : [],
        journal: Array.isArray(saved.journal) ? saved.journal : [],
        settings: { ...defaults.settings, ...(saved.settings || {}) }
      };
    } catch { return structuredClone(defaults); }
  }
  let data = load();
  function save() { localStorage.setItem(KEY, JSON.stringify(data)); }
  return {
    getAll: () => data,
    entries: () => [...data.entries].sort((a,b) => b.date.localeCompare(a.date)),
    journal: () => [...data.journal].sort((a,b) => b.date.localeCompare(a.date)),
    settings: () => ({ ...data.settings }),
    saveEntry(entry) {
      const index = data.entries.findIndex(item => item.id === entry.id);
      if (index >= 0) data.entries[index] = entry; else data.entries.push(entry);
      data.entries.sort((a,b) => a.date.localeCompare(b.date)); save();
    },
    deleteEntry(id) { data.entries = data.entries.filter(e => e.id !== id); save(); },
    saveJournal(note) {
      data.journal = data.journal.filter(n => n.date !== note.date);
      data.journal.push(note); save();
    },
    updateSettings(settings) { data.settings = { ...data.settings, ...settings }; save(); },
    replace(next) {
      if (!next || !Array.isArray(next.entries) || !Array.isArray(next.journal) || !next.settings) throw new Error("This backup file is not valid.");
      data = { entries: next.entries, journal: next.journal, settings: { ...defaults.settings, ...next.settings } }; save();
    },
    clear() { data = structuredClone(defaults); save(); }
  };
})();
