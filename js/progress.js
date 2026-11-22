// Progress, XP, levels, streaks and badges. Pure logic with an injectable storage.
export const STORAGE_KEY = "teenspeak.v1";

export const LEVELS = [
  { min: 0, name: "Rookie" },
  { min: 60, name: "Explorer" },
  { min: 180, name: "Speaker" },
  { min: 360, name: "Talker" },
  { min: 600, name: "Storyteller" },
  { min: 900, name: "Pro" },
  { min: 1300, name: "Star" },
  { min: 1800, name: "Champion" },
  { min: 2400, name: "Legend" },
  { min: 3200, name: "Native Vibes" }
];

export const BADGES = [
  { id: "first", icon: "🎤", name: "Lần đầu lên tiếng", desc: "Hoàn thành lần luyện nói đầu tiên", check: (s) => s.attempts >= 1 },
  { id: "perfect", icon: "💯", name: "Hoàn hảo", desc: "Đạt 100 điểm một câu", check: (s) => s.perfects >= 1 },
  { id: "ten-perfect", icon: "🏹", name: "Xạ thủ", desc: "Đạt 100 điểm 10 lần", check: (s) => s.perfects >= 10 },
  { id: "streak3", icon: "🔥", name: "Lửa 3 ngày", desc: "Học 3 ngày liên tiếp", check: (s) => s.streak.best >= 3 },
  { id: "streak7", icon: "⚡", name: "Tuần bất bại", desc: "Học 7 ngày liên tiếp", check: (s) => s.streak.best >= 7 },
  { id: "streak30", icon: "👑", name: "Một tháng kiên trì", desc: "Học 30 ngày liên tiếp", check: (s) => s.streak.best >= 30 },
  { id: "mastered25", icon: "📚", name: "25 câu/từ thành thạo", desc: "25 mục đạt từ 80 điểm", check: (s) => masteredCount(s) >= 25 },
  { id: "mastered100", icon: "🧠", name: "100 câu/từ thành thạo", desc: "100 mục đạt từ 80 điểm", check: (s) => masteredCount(s) >= 100 },
  { id: "roleplay", icon: "🎭", name: "Diễn viên", desc: "Hoàn thành một đoạn hội thoại", check: (s) => Object.keys(s.roleplays).length >= 1 },
  { id: "roleplay-all", icon: "🎬", name: "Đạo diễn", desc: "Hoàn thành 5 đoạn hội thoại", check: (s) => Object.keys(s.roleplays).length >= 5 },
  { id: "ears", icon: "👂", name: "Tai thính", desc: "Nghe đúng 20 lần trong Phòng âm", check: (s) => s.listening.correct >= 20 },
  { id: "daily", icon: "🎯", name: "Thử thách ngày", desc: "Hoàn thành thử thách hằng ngày", check: (s) => s.dailyDone >= 1 },
  { id: "level5", icon: "🚀", name: "Cấp 5", desc: "Lên cấp Storyteller", check: (s) => levelInfo(s.xp).index >= 4 }
];

export function defaultState() {
  return {
    version: 1,
    name: "",
    xp: 0,
    attempts: 0,
    perfects: 0,
    dailyDone: 0,
    items: {},
    days: {},
    streak: { count: 0, best: 0, lastDay: null },
    badges: {},
    roleplays: {},
    listening: { correct: 0, total: 0 },
    daily: { day: null, done: false },
    settings: { accent: "en-US", rate: 0.9, dailyGoal: 10, keepRecording: true }
  };
}

export function dayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function previousDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
}

export function levelInfo(xp) {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) index = i;
  const current = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1;
  return { index, level: index + 1, name: current.name, next, progress: Math.max(0, Math.min(1, progress)) };
}

export function masteredCount(state) {
  return Object.values(state.items).filter((i) => i.best >= 80).length;
}

export function xpForAttempt(score, previousBest) {
  let xp = 2 + Math.round(score / 10);
  if (score >= 80 && (previousBest === undefined || previousBest < 80)) xp += 5;
  if (score === 100) xp += 3;
  return xp;
}

function merge(base, saved) {
  const out = { ...base, ...saved };
  for (const key of ["streak", "listening", "daily", "settings"]) out[key] = { ...base[key], ...(saved?.[key] || {}) };
  for (const key of ["items", "days", "badges", "roleplays"]) out[key] = { ...(saved?.[key] || {}) };
  return out;
}

export function createProgress(storage, now = () => new Date()) {
  let state;
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    state = raw ? merge(defaultState(), JSON.parse(raw)) : defaultState();
  } catch {
    state = defaultState();
  }

  const save = () => {
    try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  };

  const today = () => dayKey(now());

  function touchDay() {
    const t = today();
    state.days[t] = (state.days[t] || 0) + 1;
    if (state.streak.lastDay !== t) {
      state.streak.count = state.streak.lastDay === previousDayKey(t) ? state.streak.count + 1 : 1;
      state.streak.lastDay = t;
      state.streak.best = Math.max(state.streak.best, state.streak.count);
    }
  }

  function awardBadges() {
    const fresh = [];
    for (const b of BADGES) {
      if (!state.badges[b.id] && b.check(state)) {
        state.badges[b.id] = today();
        fresh.push(b);
      }
    }
    return fresh;
  }

  function finish(xpGained, levelBefore) {
    state.xp += xpGained;
    const newBadges = awardBadges();
    const levelAfter = levelInfo(state.xp).index;
    save();
    return { xpGained, newBadges, levelUp: levelAfter > levelBefore ? levelInfo(state.xp) : null };
  }

  return {
    get state() { return state; },
    save,
    today,

    recordAttempt(itemId, score) {
      const levelBefore = levelInfo(state.xp).index;
      const prev = state.items[itemId];
      const xp = xpForAttempt(score, prev?.best);
      state.items[itemId] = { best: Math.max(prev?.best || 0, score), tries: (prev?.tries || 0) + 1, last: score };
      state.attempts += 1;
      if (score === 100) state.perfects += 1;
      touchDay();
      return finish(xp, levelBefore);
    },

    recordRoleplay(id, score) {
      const levelBefore = levelInfo(state.xp).index;
      const first = state.roleplays[id] === undefined;
      state.roleplays[id] = Math.max(state.roleplays[id] || 0, score);
      touchDay();
      return finish(first ? 30 : 10, levelBefore);
    },

    recordListening(correct) {
      const levelBefore = levelInfo(state.xp).index;
      state.listening.total += 1;
      if (correct) state.listening.correct += 1;
      touchDay();
      return finish(correct ? 2 : 0, levelBefore);
    },

    completeDaily() {
      const levelBefore = levelInfo(state.xp).index;
      if (state.daily.day === today() && state.daily.done) return finish(0, levelBefore);
      state.daily = { day: today(), done: true };
      state.dailyDone += 1;
      return finish(25, levelBefore);
    },

    dailyDoneToday() { return state.daily.day === today() && state.daily.done; },
    todayCount() { return state.days[today()] || 0; },

    currentStreak() {
      const t = today();
      const last = state.streak.lastDay;
      return last === t || last === previousDayKey(t) ? state.streak.count : 0;
    },

    itemBest(id) { return state.items[id]?.best; },
    updateSettings(patch) { state.settings = { ...state.settings, ...patch }; save(); },
    setName(name) { state.name = String(name || "").trim().slice(0, 30); save(); },
    reset() { state = defaultState(); save(); }
  };
}

// Deterministic daily pick so the challenge is the same all day.
export function seededShuffle(list, seedText) {
  let seed = 0;
  for (const ch of String(seedText)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function dailyChallenge(items, key, count = 6) {
  const words = seededShuffle(items.filter((i) => i.type === "word"), key + "w").slice(0, Math.ceil(count / 2));
  const sentences = seededShuffle(items.filter((i) => i.type === "sentence"), key + "s").slice(0, Math.floor(count / 2));
  return [...words, ...sentences];
}
