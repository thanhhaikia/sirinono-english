import test from "node:test";
import assert from "node:assert/strict";
import { normalize, scoreTranscript, bestScore, bestOfAnswers, stars, feedbackTips, wordSimilarity } from "../js/scoring.js";

test("normalize lowercases, strips punctuation and expands contractions/numbers", () => {
  assert.deepEqual(normalize("I'm learning, OK?"), ["i", "am", "learning", "ok"]);
  assert.deepEqual(normalize("I have 3 cats."), ["i", "have", "three", "cats"]);
  assert.deepEqual(normalize("Don’t worry"), ["do", "not", "worry"]);
  assert.deepEqual(normalize("Size 38"), ["size", "thirty", "eight"]);
  assert.equal(scoreTranscript("Size thirty eight, please.", "size 38 please").score, 100);
});

test("exact match scores 100 and marks every word good", () => {
  const r = scoreTranscript("My favourite subject is science.", "my favorite subject is science");
  assert.equal(r.score, 100);
  assert.ok(r.words.every((w) => w.status === "good"));
});

test("missing and wrong words lower the score", () => {
  const r = scoreTranscript("I think three is the right answer", "I sink tree is the answer");
  assert.ok(r.score < 80 && r.score > 30, `score ${r.score}`);
  const byWord = Object.fromEntries(r.words.map((w) => [w.word, w.status]));
  assert.equal(byWord.right, "missed");
  assert.equal(byWord.answer, "good");
  assert.notEqual(byWord.think, "good");
});

test("minimal pair confusion is not accepted as correct", () => {
  assert.ok(scoreTranscript("ship", "sheep").score < 100);
  assert.equal(scoreTranscript("ship", "ship").score, 100);
  assert.equal(scoreTranscript("anything", "").score, 0);
});

test("homophones count as correct", () => {
  assert.equal(wordSimilarity("right", "write"), 1);
  assert.equal(scoreTranscript("I want to go too", "I want two go to").score, 100);
});

test("extra words give only a small penalty", () => {
  const r = scoreTranscript("Thank you", "um thank you very much");
  assert.ok(r.score >= 80 && r.score < 100, `score ${r.score}`);
});

test("bestScore picks the best alternative and bestOfAnswers the best reply", () => {
  const r = bestScore("Less sugar, please.", [{ transcript: "let's sugar please" }, { transcript: "less sugar please" }]);
  assert.equal(r.score, 100);
  const b = bestOfAnswers(["A large one, please.", "Medium, please."], [{ transcript: "medium please" }]);
  assert.equal(b.index, 1);
  assert.equal(b.result.score, 100);
});

test("stars thresholds", () => {
  assert.equal(stars(95), 3);
  assert.equal(stars(75), 2);
  assert.equal(stars(45), 1);
  assert.equal(stars(10), 0);
});

test("feedback tips target missed words with Vietnamese advice", () => {
  const r = scoreTranscript("think", "sink");
  const tips = feedbackTips(r.words);
  assert.ok(tips.length >= 1);
  assert.match(tips[0].tip, /th/);
  assert.deepEqual(feedbackTips(scoreTranscript("think", "think").words), []);
});
