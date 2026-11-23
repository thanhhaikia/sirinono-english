// Remembers an unfinished practice, quiz or role-play so a reload or Back does not lose it.
export const RESUME_KEY = "sirinono.resume.v1";
export const SHORT_LIVED_MS = 30 * 60 * 1000;

export function createResume(storage, now = () => Date.now()) {
  const read = () => {
    try {
      const all = JSON.parse(storage?.getItem(RESUME_KEY));
      return all && typeof all === "object" ? all : {};
    } catch {
      return {};
    }
  };
  const write = (all) => {
    try { storage?.setItem(RESUME_KEY, JSON.stringify(all)); } catch { /* storage full or blocked */ }
  };
  return {
    get(kind, maxAgeMs = Infinity) {
      const entry = read()[kind];
      return entry && now() - entry.at <= maxAgeMs ? entry.data : null;
    },
    set(kind, data) { write({ ...read(), [kind]: { at: now(), data } }); },
    clear(kind) { const all = read(); delete all[kind]; write(all); },
    clearAll() { write({}); }
  };
}
