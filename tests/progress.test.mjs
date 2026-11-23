import test from "node:test";
import assert from "node:assert/strict";
import { createProgress, levelInfo, xpForAttempt, dailyChallenge, STORAGE_KEY, previousDayKey } from "../js/progress.js";

function memoryStorage() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), data };
}

function clock(start) {
  let now = new Date(start);
  return { now: () => now, addDays: (n) => { now = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n, 12); } };
}

test("xp rewards higher scores and first mastery", () => {
  assert.equal(xpForAttempt(0, undefined), 2);
  assert.equal(xpForAttempt(85, undefined), 2 + 9 + 5);
  assert.equal(xpForAttempt(85, 90), 2 + 9);
  assert.equal(xpForAttempt(100, 100), 2 + 10 + 3);
});

test("levels progress with xp", () => {
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(60).name, "Explorer");
  assert.equal(levelInfo(99999).next, null);
});

test("recordAttempt saves best score, xp, badges and persists", () => {
  const storage = memoryStorage();
  const c = clock("2026-11-22T10:00:00");
  const p = createProgress(storage, c.now);
  const out = p.recordAttempt("school-w0", 100);
  assert.ok(out.xpGained > 0);
  assert.deepEqual(out.newBadges.map((b) => b.id).sort(), ["first", "perfect"]);
  p.recordAttempt("school-w0", 40);
  assert.equal(p.itemBest("school-w0"), 100);
  const reloaded = createProgress(storage, c.now);
  assert.equal(reloaded.state.attempts, 2);
  assert.ok(JSON.parse(storage.data.get(STORAGE_KEY)).badges.first);
});

test("streak grows on consecutive days and resets after a gap", () => {
  const c = clock("2026-11-20T09:00:00");
  const p = createProgress(memoryStorage(), c.now);
  p.recordAttempt("a", 50);
  c.addDays(1); p.recordAttempt("a", 50);
  c.addDays(1); p.recordAttempt("a", 50);
  assert.equal(p.currentStreak(), 3);
  assert.ok(p.state.badges.streak3);
  c.addDays(1);
  assert.equal(p.currentStreak(), 3);
  c.addDays(1);
  assert.equal(p.currentStreak(), 0);
  p.recordAttempt("a", 50);
  assert.equal(p.currentStreak(), 1);
  assert.equal(p.state.streak.best, 3);
});

test("daily challenge is deterministic per day and only rewarded once", () => {
  const items = Array.from({ length: 20 }, (_, i) => ({ id: `i${i}`, type: i % 2 ? "word" : "sentence" }));
  assert.deepEqual(dailyChallenge(items, "2026-11-22"), dailyChallenge(items, "2026-11-22"));
  assert.equal(dailyChallenge(items, "2026-11-22").length, 6);
  const p = createProgress(memoryStorage(), () => new Date("2026-11-22T08:00:00"));
  assert.equal(p.completeDaily().xpGained, 25);
  assert.equal(p.completeDaily().xpGained, 0);
  assert.ok(p.dailyDoneToday());
});

test("previousDayKey crosses month boundaries", () => {
  assert.equal(previousDayKey("2026-12-01"), "2026-11-30");
  assert.equal(previousDayKey("2026-01-01"), "2025-12-31");
});

test("corrupt storage falls back to defaults", () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, "{bad json");
  const p = createProgress(storage);
  assert.equal(p.state.xp, 0);
});

test("reload picks up progress saved by another tab", () => {
  const storage = memoryStorage();
  const a = createProgress(storage);
  const b = createProgress(storage);
  a.recordAttempt("w1", 90);
  b.reload();
  b.recordAttempt("w2", 80);
  const fresh = createProgress(storage);
  assert.ok(fresh.state.items.w1 && fresh.state.items.w2);
});

test("reviewItems lists items whose latest attempt was weak, newest first", () => {
  let t = new Date("2026-11-22T10:00:00").getTime();
  const p = createProgress(memoryStorage(), () => new Date((t += 1000)));
  p.recordAttempt("a", 40, "hat");
  p.recordAttempt("b", 95, "ship");
  p.recordAttempt("c", 100, "sheep");
  p.recordAttempt("c", 30, "x".repeat(200));
  assert.deepEqual(p.reviewItems().map((r) => r.id), ["c", "a"]);
  assert.equal(p.reviewItems()[0].heard.length, 80);
  p.recordAttempt("a", 90, "hat");
  assert.deepEqual(p.reviewItems().map((r) => r.id), ["c"]);
  for (let i = 0; i < 25; i++) p.recordAttempt(`w${i}`, 10);
  assert.equal(p.reviewItems().length, 26);
  assert.equal(p.reviewItems(5).length, 5);
});
