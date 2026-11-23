import test from "node:test";
import assert from "node:assert/strict";

// js/speech.js reads window.SirinonoNative when it loads, so the fake bridge must exist before the import.
const calls = [];
const bridge = {
  canRecognize: () => true,
  speak: (id, text, lang, rate) => calls.push(["speak", id, text, lang, rate]),
  stopSpeaking: () => calls.push(["stopSpeaking"]),
  listen: (id, lang) => calls.push(["listen", id, lang]),
  stopListening: () => calls.push(["stopListening"])
};
globalThis.window = { SirinonoNative: bridge };
const { support, speak, stopSpeaking, listen, ERROR_TEXT } = await import("../js/speech.js");
const answer = (result) => window.__sirinonoNative(calls.at(-1)[1], result);

test("the Android bridge replaces the browser speech features", () => {
  assert.deepEqual(support, { native: true, recognition: true, synthesis: true, recording: false });
  assert.match(ERROR_TEXT["not-allowed"], /Cài đặt/);
  assert.match(ERROR_TEXT["no-speech"], /nói to/);
});

test("speak resolves with the result Android reports", async () => {
  const spoken = speak("Hello", { lang: "en-GB", rate: 0.7 });
  assert.deepEqual(calls.at(-1).slice(2), ["Hello", "en-GB", 0.7]);
  answer({ ok: true });
  assert.equal(await spoken, true);

  const interrupted = speak("Again");
  answer({ ok: false });
  assert.equal(await interrupted, false);

  stopSpeaking();
  assert.deepEqual(calls.at(-1), ["stopSpeaking"]);
});

test("listen resolves with the alternatives Android heard", async () => {
  const pending = listen({ lang: "en-US" });
  assert.equal(calls.at(-1)[2], "en-US");
  answer({ alternatives: [{ transcript: "good morning", confidence: 0.9 }] });
  assert.deepEqual(await pending, { alternatives: [{ transcript: "good morning", confidence: 0.9 }], audioUrl: null });
});

test("listen rejects with the error code and stop reaches Android", async () => {
  const pending = listen();
  const id = calls.at(-1)[1];
  pending.stop();
  assert.deepEqual(calls.at(-1), ["stopListening"]);
  window.__sirinonoNative(id, { error: "not-allowed" });
  await assert.rejects(pending, { code: "not-allowed" });

  const silent = listen();
  answer({ alternatives: [] });
  await assert.rejects(silent, { code: "no-speech" });
});

test("a repeated or unknown answer is ignored", async () => {
  const pending = listen();
  const id = calls.at(-1)[1];
  window.__sirinonoNative(id, { alternatives: [{ transcript: "one", confidence: 1 }] });
  window.__sirinonoNative(id, { error: "network" });
  window.__sirinonoNative(9999, { ok: true });
  assert.equal((await pending).alternatives[0].transcript, "one");
});
