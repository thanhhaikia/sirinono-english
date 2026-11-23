import test from "node:test";
import assert from "node:assert/strict";
import { createResume, RESUME_KEY, SHORT_LIVED_MS } from "../js/resume.js";

function memoryStorage() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), data };
}

test("resume keeps each activity separately and survives a new instance", () => {
  const storage = memoryStorage();
  const r = createResume(storage);
  r.set("practice", { index: 3 });
  r.set("quiz", { round: 2 });
  const fresh = createResume(storage);
  assert.deepEqual(fresh.get("practice"), { index: 3 });
  fresh.clear("practice");
  assert.equal(fresh.get("practice"), null);
  assert.deepEqual(fresh.get("quiz"), { round: 2 });
  fresh.clearAll();
  assert.equal(fresh.get("quiz"), null);
});

test("resume entries older than the allowed age are ignored", () => {
  let t = 1000;
  const r = createResume(memoryStorage(), () => t);
  r.set("quiz", { round: 1 });
  t += SHORT_LIVED_MS;
  assert.deepEqual(r.get("quiz", SHORT_LIVED_MS), { round: 1 });
  t += 1;
  assert.equal(r.get("quiz", SHORT_LIVED_MS), null);
  assert.deepEqual(r.get("quiz"), { round: 1 });
});

test("resume tolerates corrupt or missing storage", () => {
  const storage = memoryStorage();
  storage.setItem(RESUME_KEY, "{oops");
  assert.equal(createResume(storage).get("practice"), null);
  storage.setItem(RESUME_KEY, "null");
  assert.equal(createResume(storage).get("practice"), null);
  const none = createResume(null);
  none.set("practice", {});
  assert.equal(none.get("practice"), null);
});
