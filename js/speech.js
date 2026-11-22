// Browser speech helpers: text-to-speech, speech recognition and audio recording.
const Recognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export const support = {
  recognition: !!Recognition,
  synthesis: typeof window !== "undefined" && "speechSynthesis" in window,
  recording: typeof window !== "undefined" && !!(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined"
};

let voices = [];
function loadVoices() {
  if (!support.synthesis) return;
  voices = window.speechSynthesis.getVoices();
}
if (support.synthesis) {
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

export const ERROR_TEXT = {
  "not-allowed": "Bạn chưa cho phép dùng micro. Hãy bấm vào biểu tượng ổ khoá trên thanh địa chỉ để bật micro.",
  "service-not-allowed": "Trình duyệt không cho phép nhận diện giọng nói. Hãy thử Chrome hoặc Edge.",
  "no-speech": "Mình chưa nghe thấy gì. Hãy nói to và rõ hơn nhé.",
  "audio-capture": "Không tìm thấy micro. Hãy kiểm tra tai nghe hoặc micro.",
  network: "Mất kết nối mạng. Nhận diện giọng nói cần Internet.",
  aborted: "Đã dừng nghe.",
  unsupported: "Trình duyệt này chưa hỗ trợ nhận diện giọng nói. Hãy dùng Chrome (Android/máy tính) hoặc Safari (iPhone)."
};

// Listen once. Resolves { alternatives: [{transcript, confidence}], audioUrl } or rejects with { code }.
export function listen({ lang = "en-US", record = true, maxMs = 9000, onStart } = {}) {
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
