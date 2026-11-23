// Speech helpers: text-to-speech, speech recognition and audio recording.
// In a browser they use the Web Speech API. Inside the Android app the WebView has no Web Speech API,
// so the app injects window.SirinonoNative and speech goes through Android instead.
const Recognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const native = typeof window !== "undefined" ? window.SirinonoNative || null : null;

export const support = {
  native: !!native,
  recognition: native ? !!native.canRecognize() : !!Recognition,
  synthesis: !!native || (typeof window !== "undefined" && "speechSynthesis" in window),
  // The Android recognizer owns the microphone while it listens, so there is no second stream to record.
  recording: !native && typeof window !== "undefined" && !!(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined"
};

// Each native call gets an id; Android answers once with window.__sirinonoNative(id, result).
const nativeCalls = new Map();
let nativeCallId = 0;
if (native) {
  window.__sirinonoNative = (id, result) => {
    const done = nativeCalls.get(id);
    nativeCalls.delete(id);
    done?.(result || {});
  };
}
function callNative(start) {
  return new Promise((resolve) => {
    const id = ++nativeCallId;
    nativeCalls.set(id, resolve);
    start(id);
  });
}

let voices = [];
const webSynthesis = !native && support.synthesis;
function loadVoices() {
  if (!webSynthesis) return;
  voices = window.speechSynthesis.getVoices();
}
if (webSynthesis) {
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}

export function hasVoice(lang) {
  return voices.some((v) => v.lang?.replace("_", "-").toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));
}

function pickVoice(lang) {
  const norm = (l) => (l || "").replace("_", "-").toLowerCase();
  const exact = voices.filter((v) => norm(v.lang) === lang.toLowerCase());
  const pool = exact.length ? exact : voices.filter((v) => norm(v.lang).startsWith("en"));
  return pool.find((v) => /google|natural|samantha|daniel|enhanced/i.test(v.name)) || pool[0] || null;
}

export function speak(text, { lang = "en-US", rate = 0.9 } = {}) {
  if (native) return callNative((id) => native.speak(id, String(text), lang, rate)).then((r) => !!r.ok);
  return new Promise((resolve) => {
    if (!support.synthesis) return resolve(false);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (native) return native.stopSpeaking();
  if (support.synthesis) window.speechSynthesis.cancel();
}

async function startRecorder() {
  if (!support.recording) return null;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.start();
    return {
      stop: () => new Promise((resolve) => {
        const done = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(chunks.length ? URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" })) : null);
        };
        if (rec.state === "inactive") return done();
        rec.onstop = done;
        rec.stop();
      })
    };
  } catch {
    return null;
  }
}

const WEB_ERROR_TEXT = {
  "not-allowed": "Bạn chưa cho phép dùng micro. Hãy bấm vào biểu tượng ổ khoá trên thanh địa chỉ để bật micro.",
  "service-not-allowed": "Trình duyệt không cho phép nhận diện giọng nói. Hãy thử Chrome hoặc Edge.",
  "no-speech": "Mình chưa nghe thấy gì. Hãy nói to và rõ hơn nhé.",
  "audio-capture": "Không tìm thấy micro. Hãy kiểm tra tai nghe hoặc micro.",
  network: "Mất kết nối mạng. Nhận diện giọng nói cần Internet.",
  aborted: "Đã dừng nghe.",
  unsupported: "Trình duyệt này chưa hỗ trợ nhận diện giọng nói. Hãy dùng Chrome (Android/máy tính) hoặc Safari (iPhone)."
};

const NATIVE_ERROR_TEXT = {
  ...WEB_ERROR_TEXT,
  "not-allowed": "Bạn chưa cho phép dùng micro. Hãy vào Cài đặt → Ứng dụng → Sirinono → Quyền và bật Micrô.",
  "service-not-allowed": "Dịch vụ nhận diện giọng nói trên máy đang gặp lỗi. Hãy thử lại sau ít phút.",
  unsupported: "Máy này chưa có dịch vụ nhận diện giọng nói. Hãy cài hoặc bật ứng dụng Google."
};

export const ERROR_TEXT = native ? NATIVE_ERROR_TEXT : WEB_ERROR_TEXT;

function listenNative(lang, maxMs, onStart) {
  let timer = null;
  const promise = callNative((id) => {
    native.listen(id, lang);
    onStart?.();
    timer = setTimeout(() => native.stopListening(), maxMs);
  }).then((r) => {
    clearTimeout(timer);
    if (r.alternatives?.length) return { alternatives: r.alternatives, audioUrl: null };
    throw { code: r.error || "no-speech" };
  });
  promise.stop = () => native.stopListening();
  return promise;
}

// Listen once. Resolves { alternatives: [{transcript, confidence}], audioUrl } or rejects with { code }.
export function listen({ lang = "en-US", record = true, maxMs = 9000, onStart } = {}) {
  if (native) return listenNative(lang, maxMs, onStart);
  if (!Recognition) return Promise.reject({ code: "unsupported" });
  let active = null;
  let stopped = false;
  const promise = new Promise(async (resolve, reject) => {
    const recorder = record ? await startRecorder() : null;
    if (stopped) {
      const audioUrl = recorder ? await recorder.stop() : null;
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      return reject({ code: "aborted" });
    }
    const r = new Recognition();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 5;
    r.continuous = false;
    let alternatives = [];
    let error = null;
    let timer = null;
    r.onstart = () => onStart?.();
    r.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      alternatives = Array.from(res).map((a) => ({ transcript: a.transcript, confidence: a.confidence }));
    };
    r.onerror = (e) => { error = e.error || "unknown"; };
    r.onend = async () => {
      clearTimeout(timer);
      const audioUrl = recorder ? await recorder.stop() : null;
      if (alternatives.length) resolve({ alternatives, audioUrl });
      else reject({ code: error || "no-speech", audioUrl });
    };
    active = r;
    try {
      r.start();
      timer = setTimeout(() => r.stop(), maxMs);
    } catch (err) {
      if (recorder) await recorder.stop();
      reject({ code: "aborted" });
    }
  });
  promise.stop = () => { stopped = true; active?.stop(); };
  return promise;
}
