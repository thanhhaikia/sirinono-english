import test from "node:test";
import assert from "node:assert/strict";
import { TOPICS, SOUNDS, ROLEPLAYS, ALL_ITEMS } from "../js/data.js";
import { scoreTranscript } from "../js/scoring.js";

test("item ids are unique and every item has text and Vietnamese", () => {
  const ids = ALL_ITEMS.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const i of ALL_ITEMS) {
    assert.ok(i.text && i.vi, i.id);
    assert.equal(scoreTranscript(i.text, i.text).score, 100, `self-score ${i.id}`);
  }
});

test("content size", () => {
  assert.equal(TOPICS.length, 8);
  assert.ok(SOUNDS.length >= 8);
  assert.ok(ROLEPLAYS.length >= 6);
  for (const rp of ROLEPLAYS) for (const t of rp.turns) assert.ok(t.replies.length >= 2, rp.id);
});

test("minimal pairs differ", () => {
  for (const s of SOUNDS) for (const [a, b] of s.pairs) assert.ok(scoreTranscript(a, b).score < 100, `${a}/${b}`);
});
