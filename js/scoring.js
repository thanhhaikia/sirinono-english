// Pure scoring helpers: compare what the browser heard with the target text.
const CONTRACTIONS = {
  "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are",
  "he's": "he is", "she's": "she is", "it's": "it is", "that's": "that is",
  "what's": "what is", "there's": "there is", "let's": "let us", "i've": "i have",
  "you've": "you have", "we've": "we have", "i'll": "i will", "you'll": "you will",
  "we'll": "we will", "i'd": "i would", "you'd": "you would", "don't": "do not",
  "doesn't": "does not", "didn't": "did not", "can't": "can not", "cannot": "can not",
  "won't": "will not", "isn't": "is not", "aren't": "are not", "wasn't": "was not",
  "weren't": "were not", "haven't": "have not", "hasn't": "has not", "couldn't": "could not",
  "shouldn't": "should not", "wouldn't": "would not", "how's": "how is", "where's": "where is",
  "who's": "who is", "gonna": "going to", "wanna": "want to"
};

const NUMBERS = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
  "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten", "11": "eleven",
  "12": "twelve", "15": "fifteen", "20": "twenty", "30": "thirty", "50": "fifty", "100": "hundred"
};

const HOMOPHONES = [
  ["to", "too", "two"], ["there", "their"], ["right", "write"], ["know", "no"],
  ["for", "four"], ["hear", "here"], ["see", "sea"], ["by", "buy", "bye"],
  ["one", "won"], ["eight", "ate"], ["new", "knew"], ["week", "weak"],
  ["meet", "meat"], ["whole", "hole"], ["hour", "our"], ["its", "it's"],
  ["piece", "peace"], ["flour", "flower"], ["break", "brake"], ["mail", "male"],
  ["ok", "okay"], ["mr", "mister"], ["tv", "t.v."], ["grey", "gray"], ["colour", "color"],
  ["favourite", "favorite"], ["center", "centre"]
];
const HOMOPHONE_KEY = new Map();
HOMOPHONES.forEach((group, i) => group.forEach((w) => HOMOPHONE_KEY.set(w, i)));

export function normalize(text) {
  const cleaned = String(text || "")
    .toLowerCase()
    .replace(/[\u2018\u2019`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .trim();
  if (!cleaned) return [];
  const out = [];
  for (const raw of cleaned.split(/\s+/)) {
    const w = raw.replace(/^'+|'+$/g, "");
    if (!w) continue;
    const expanded = CONTRACTIONS[w] || NUMBERS[w] || w;
    out.push(...expanded.split(" "));
  }
  return out;
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

export function wordSimilarity(a, b) {
  if (a === b) return 1;
  const ka = HOMOPHONE_KEY.get(a);
  if (ka !== undefined && ka === HOMOPHONE_KEY.get(b)) return 1;
  const maxLen = Math.max(a.length, b.length);
  return maxLen ? 1 - levenshtein(a, b) / maxLen : 1;
}

// Align target words with heard words (edit-distance alignment on tokens).
export function alignWords(targetWords, heardWords) {
  const n = targetWords.length;
  const m = heardWords.length;
  const cost = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const move = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(""));
  for (let i = 1; i <= n; i++) { cost[i][0] = i; move[i][0] = "del"; }
  for (let j = 1; j <= m; j++) { cost[0][j] = j * 0.5; move[0][j] = "ins"; }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sim = wordSimilarity(targetWords[i - 1], heardWords[j - 1]);
      const sub = cost[i - 1][j - 1] + (1 - sim) * 1.2;
      const del = cost[i - 1][j] + 1;
      const ins = cost[i][j - 1] + 0.5;
      if (sub <= del && sub <= ins) { cost[i][j] = sub; move[i][j] = "sub"; }
      else if (del <= ins) { cost[i][j] = del; move[i][j] = "del"; }
      else { cost[i][j] = ins; move[i][j] = "ins"; }
    }
  }
  const result = new Array(n);
  let extra = 0;
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const mv = move[i][j];
    if (mv === "sub") {
      const sim = wordSimilarity(targetWords[i - 1], heardWords[j - 1]);
      result[i - 1] = { word: targetWords[i - 1], heard: heardWords[j - 1], similarity: sim };
      i--; j--;
    } else if (mv === "del") {
      result[i - 1] = { word: targetWords[i - 1], heard: null, similarity: 0 };
      i--;
    } else {
      extra++;
      j--;
    }
  }
  return { words: result, extra };
}

export function statusFor(similarity) {
  if (similarity >= 0.999) return "good";
  if (similarity >= 0.6) return "close";
  return "missed";
}

export function scoreTranscript(target, transcript) {
  const targetWords = normalize(target);
  const heardWords = normalize(transcript);
  if (!targetWords.length) return { score: 0, words: [], extra: 0, transcript };
  const { words, extra } = alignWords(targetWords, heardWords);
  let total = 0;
  const detailed = words.map((w) => {
    const status = statusFor(w.similarity);
    total += status === "good" ? 1 : status === "close" ? w.similarity * 0.6 : 0;
    return { ...w, status };
  });
  const penalty = Math.min(0.2, (extra / targetWords.length) * 0.15);
  const score = Math.max(0, Math.round((total / targetWords.length - penalty) * 100));
  return { score, words: detailed, extra, transcript };
}

// Pick the recognition alternative that best matches the target.
export function bestScore(target, alternatives) {
  const list = (alternatives || []).filter((a) => a && typeof a.transcript === "string");
  if (!list.length) return scoreTranscript(target, "");
  let best = null;
  for (const alt of list) {
    const r = scoreTranscript(target, alt.transcript);
    if (!best || r.score > best.score) best = r;
  }
  return best;
}

// Score against several acceptable answers (role-play), return best + which one.
export function bestOfAnswers(answers, alternatives) {
  let best = null;
  answers.forEach((answer, index) => {
    const r = bestScore(answer, alternatives);
    if (!best || r.score > best.result.score) best = { index, answer, result: r };
  });
  return best;
}

export function stars(score) {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 40) return 1;
  return 0;
}

export function verdict(score) {
  if (score >= 90) return { label: "Xuất sắc!", tone: "great" };
  if (score >= 70) return { label: "Tốt lắm!", tone: "good" };
  if (score >= 40) return { label: "Gần được rồi", tone: "ok" };
  return { label: "Thử lại nhé", tone: "low" };
}

// Vietnamese tips based on spelling patterns that are hard for Vietnamese speakers.
const TIP_RULES = [
  { test: (w) => /th/.test(w), tip: "Âm \"th\": đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi (think /θ/) hoặc rung cổ (this /ð/). Đừng đọc thành \"t\" hay \"d\"." },
  { test: (w) => /sh|tion|sion/.test(w), tip: "Âm /ʃ/ (sh, -tion): chu môi ra trước, lưỡi lùi về sau, phát ra tiếng \"suỵt\"." },
  { test: (w) => /^r|[^aeiou]r/.test(w), tip: "Âm /r/: cong lưỡi về sau, không chạm vòm miệng, môi hơi tròn. Không rung lưỡi như \"r\" tiếng Việt." },
  { test: (w) => /[^aeiou]l|l[^aeiouy]|l$/.test(w), tip: "Âm /l/ cuối hoặc giữa từ: chạm đầu lưỡi lên lợi trên và giữ lại một chút." },
  { test: (w) => /(s|ce|x)$/.test(w) && !/ss$/.test(w), tip: "Nhớ đọc âm cuối /s/ hoặc /z/ rõ ràng, người Việt hay bỏ mất âm này." },
  { test: (w) => /(ed)$/.test(w), tip: "Đuôi -ed: đọc /t/, /d/ hoặc /ɪd/. Đừng bỏ âm cuối." },
  { test: (w) => /(k|ck|ke|ct|pt|ft|st|nd|nt|ld|lt)$/.test(w), tip: "Từ kết thúc bằng phụ âm: bật nhẹ âm cuối cho người nghe thấy." },
  { test: (w) => /v/.test(w), tip: "Âm /v/: răng trên chạm nhẹ môi dưới và rung cổ họng." },
  { test: (w) => /z/.test(w), tip: "Âm /z/: giống /s/ nhưng có rung cổ họng, như tiếng ong \"zzz\"." },
  { test: (w) => /j|dge|ge$/.test(w), tip: "Âm /dʒ/ (j, -dge): giống \"ch\" nhưng có rung cổ, môi hơi chu." },
  { test: (w) => /ch/.test(w), tip: "Âm /tʃ/ (ch): môi chu ra, bật hơi mạnh, khác \"ch\" tiếng Việt." },
  { test: (w) => /(str|spr|scr|spl|[bcdfgkpt][lr])/.test(w), tip: "Cụm phụ âm: đọc liền các phụ âm, không chèn thêm nguyên âm \"ơ\" ở giữa." },
  { test: (w) => w.length >= 7, tip: "Từ dài: tách âm tiết và nhấn đúng trọng âm, nghe mẫu ở tốc độ chậm rồi đọc theo." }
];

export function tipsForWord(word) {
  const w = String(word || "").toLowerCase();
  return TIP_RULES.filter((r) => r.test(w)).map((r) => r.tip).slice(0, 2);
}

export function feedbackTips(words, limit = 3) {
  const tips = [];
  const seen = new Set();
  for (const w of words || []) {
    if (w.status === "good") continue;
    for (const t of tipsForWord(w.word)) {
      if (seen.has(t)) continue;
      seen.add(t);
      tips.push({ word: w.word, tip: t });
      if (tips.length >= limit) return tips;
    }
  }
  return tips;
}
