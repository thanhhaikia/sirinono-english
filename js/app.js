import { TOPICS, SOUNDS, ROLEPLAYS, ALL_ITEMS } from "./data.js";
import { bestScore, bestOfAnswers, stars, verdict, feedbackTips, normalize } from "./scoring.js";
import { createProgress, levelInfo, masteredCount, BADGES, dailyChallenge, dayKey, previousDayKey } from "./progress.js";
import { support, speak, stopSpeaking, listen, ERROR_TEXT } from "./speech.js";

const progress = createProgress(window.localStorage);
const view = document.getElementById("view");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const $ = (sel) => view.querySelector(sel);
const $$ = (sel) => Array.from(view.querySelectorAll(sel));
const settings = () => progress.state.settings;
const say = (text, slow = false) => speak(text, { lang: settings().accent, rate: slow ? 0.6 : settings().rate });

let session = null;   // practice session
let chat = null;      // role-play state
let quiz = null;      // listening quiz state
let activeListen = null;

// ---------- shared UI ----------
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function celebrate(outcome) {
  if (!outcome) return;
  const msgs = [];
  if (outcome.levelUp) msgs.push(`🚀 Lên cấp ${outcome.levelUp.level}: ${outcome.levelUp.name}!`);
  outcome.newBadges.forEach((b) => msgs.push(`${b.icon} Huy hiệu mới: ${b.name}`));
  msgs.forEach((m, i) => setTimeout(() => toast(m), i * 2800));
}

function renderTopStats() {
  const s = progress.state;
  const lv = levelInfo(s.xp);
  document.getElementById("topStats").innerHTML =
    `<span title="Chuỗi ngày">🔥 ${progress.currentStreak()}</span><span title="Điểm kinh nghiệm">⭐ ${s.xp}</span><span title="Cấp độ">Lv ${lv.level}</span>`;
}

function setTab(tab) {
  document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("active", a.dataset.tab === tab));
}

function bestPill(id) {
  const best = progress.itemBest(id);
  if (best === undefined) return `<span class="pill">Mới</span>`;
  const cls = best >= 80 ? "good" : best >= 50 ? "close" : "missed";
  return `<span class="pill ${cls}">${best}</span>`;
}

function mastery(items) {
  const done = items.filter((i) => (progress.itemBest(i.id) || 0) >= 80).length;
  return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
}

function micNotice() {
  if (support.recognition) return "";
  return `<div class="notice">${ERROR_TEXT.unsupported} Bạn vẫn có thể nghe mẫu và gõ câu để thử chấm điểm.</div>`;
}

// ---------- home ----------
function renderHome() {
  setTab("home");
  const s = progress.state;
  const lv = levelInfo(s.xp);
  const goal = s.settings.dailyGoal;
  const today = progress.todayCount();
  const dailyDone = progress.dailyDoneToday();
  const suggestion = TOPICS.find((t) => mastery(t.items).pct < 100) || TOPICS[0];
  view.innerHTML = `
    <section class="card hero">
      <p class="muted">${s.name ? `Chào ${esc(s.name)}!` : "Chào bạn!"} Hôm nay luyện nói một chút nhé.</p>
      <h1>Lv ${lv.level} · ${lv.name}</h1>
      <div class="bar"><i style="width:${Math.round(lv.progress * 100)}%"></i></div>
      <p class="muted small" style="margin-top:6px">${s.xp} XP${lv.next ? ` · còn ${lv.next.min - s.xp} XP để lên ${lv.next.name}` : " · cấp cao nhất!"}</p>
      <div class="row" style="margin-top:12px">
        <span class="btn light">🔥 ${progress.currentStreak()} ngày</span>
        <span class="btn light">🎯 ${Math.min(today, goal)}/${goal} hôm nay</span>
      </div>
    </section>
    ${s.name ? "" : `
    <section class="card">
      <h3>Bạn tên là gì?</h3>
      <div class="typed"><input id="nameInput" maxlength="30" placeholder="Ví dụ: Minh"><button class="btn primary" id="saveName">Lưu</button></div>
    </section>`}
    ${micNotice()}
    <section class="card">
      <div class="row spread">
        <div><h3>🎯 Thử thách hôm nay</h3><p class="muted small">6 từ và câu chọn ngẫu nhiên. Hoàn thành để nhận +25 XP.</p></div>
        ${dailyDone ? `<span class="pill good">Đã xong ✓</span>` : ""}
      </div>
      <button class="btn primary block" id="startDaily">${dailyDone ? "Luyện lại thử thách" : "Bắt đầu thử thách"}</button>
    </section>
    <h2 class="section-title">Học tiếp</h2>
    <a class="tile" href="#/topic/${suggestion.id}" style="--accent:${suggestion.color}">
      <div class="row spread"><span class="icon">${suggestion.icon}</span><span class="pill">${mastery(suggestion.items).done}/${suggestion.items.length}</span></div>
      <h3>${suggestion.title}</h3><p class="muted small">${suggestion.vi}</p>
      <div class="bar"><i style="width:${mastery(suggestion.items).pct}%"></i></div>
    </a>
    <div class="grid" style="margin-top:12px">
      <a class="tile" href="#/sounds" style="--accent:#ec4899"><span class="icon">👅</span><h3>Phòng âm</h3><p class="muted small">Luyện các âm khó: th, sh, r/l, âm cuối…</p></a>
      <a class="tile" href="#/roleplay" style="--accent:#f59e0b"><span class="icon">🎭</span><h3>Hội thoại</h3><p class="muted small">Nhập vai: làm quen, gọi đồ uống, chơi game…</p></a>
    </div>`;
  $("#startDaily").onclick = () => {
    const items = dailyChallenge(ALL_ITEMS, progress.today());
    startSession({ title: "Thử thách hôm nay", items, back: "#/home", daily: true });
  };
  const save = $("#saveName");
  if (save) save.onclick = () => { progress.setName($("#nameInput").value); renderHome(); };
}

// ---------- topics ----------
function renderTopics() {
  setTab("topics");
  view.innerHTML = `
    <h1>Bài học theo chủ đề</h1>
    <p class="muted">Mỗi chủ đề có 10 từ và 6 câu. Đạt từ 80 điểm để tính là thành thạo.</p>
    <div class="grid" style="margin-top:12px">
      ${TOPICS.map((t) => {
        const m = mastery(t.items);
        return `<a class="tile" href="#/topic/${t.id}" style="--accent:${t.color}">
          <div class="row spread"><span class="icon">${t.icon}</span><span class="pill">${m.done}/${m.total}</span></div>
          <h3>${t.title}</h3><p class="muted small">${t.vi}</p>
          <div class="bar"><i style="width:${m.pct}%"></i></div></a>`;
      }).join("")}
    </div>`;
}

function renderItemList(items) {
  return `<ul class="item-list">${items.map((i, idx) => `
    <li>
      <button class="btn ghost" data-say="${esc(i.text)}" aria-label="Nghe">🔊</button>
      <div style="flex:1;text-align:left"><b>${esc(i.text)}</b>${i.ipa ? ` <span class="muted small">${esc(i.ipa)}</span>` : ""}<div class="muted small">${esc(i.vi)}</div></div>
      ${bestPill(i.id)}
      <button class="btn" data-start="${idx}">Luyện</button>
    </li>`).join("")}</ul>`;
}


function renderTopic(id) {
  setTab("topics");
  const t = TOPICS.find((x) => x.id === id);
  if (!t) return go("#/topics");
  const words = t.items.filter((i) => i.type === "word");
  const sentences = t.items.filter((i) => i.type === "sentence");
  const back = `#/topic/${t.id}`;
  view.innerHTML = `
    <a href="#/topics" class="btn ghost">← Chủ đề</a>
    <section class="card" style="border-top:5px solid ${t.color}">
      <h1>${t.icon} ${t.title}</h1><p class="muted">${t.vi}</p>
      <div class="row"><button class="btn primary" id="all">Luyện cả bài</button><button class="btn" id="weak">Luyện mục chưa tốt</button></div>
    </section>
    <h2 class="section-title">Từ vựng</h2><section class="card">${renderItemList(words)}</section>
    <h2 class="section-title">Câu</h2><section class="card" id="sentences">${renderItemList(sentences)}</section>`;
  $$("[data-say]").forEach((b) => (b.onclick = () => say(b.dataset.say)));
  $$(".card:not(#sentences) [data-start]").forEach((b) => (b.onclick = () => startSession({ title: t.title, items: words, back, start: Number(b.dataset.start) })));
  $$("#sentences [data-start]").forEach((b) => (b.onclick = () => startSession({ title: t.title, items: sentences, back, start: Number(b.dataset.start) })));
  $("#all").onclick = () => startSession({ title: t.title, items: t.items, back });
  $("#weak").onclick = () => {
    const weak = t.items.filter((i) => (progress.itemBest(i.id) || 0) < 80);
    if (!weak.length) return toast("Bạn đã thành thạo cả bài rồi! 🎉");
    startSession({ title: t.title, items: weak, back });
  };
}

// ---------- practice session ----------
function startSession({ title, items, back, start = 0, daily = false, sound = null }) {
  session = { title, items, back, index: start, daily, sound, result: null, results: {}, listening: false, error: null, showTyped: !support.recognition };
  if (location.hash === "#/practice") renderPractice(); else go("#/practice");
}

function wordsHtml(item, result) {
  if (!result) {
    return item.text.split(/\s+/).map((w) => `<span class="w" data-word="${esc(w)}">${esc(w)}</span>`).join(" ");
  }
  const raw = item.text.split(/\s+/);
  let k = 0;
  return raw.map((token) => {
    const parts = normalize(token);
    let status = "good";
    for (let p = 0; p < parts.length; p++) {
      const w = result.words[k++];
      if (!w) continue;
      if (w.status === "missed") status = "missed";
      else if (w.status === "close" && status === "good") status = "close";
    }
    return `<span class="w ${status}" data-word="${esc(token)}">${esc(token)}</span>`;
  }).join(" ");
}

function renderPractice() {
  if (!session) return go("#/home");
  const s = session;
  const item = s.items[s.index];
  const r = s.result;
  const v = r ? verdict(r.score) : null;
  view.innerHTML = `
    <div class="row spread"><a href="${s.back}" class="btn ghost">← Thoát</a><span class="counter muted small">${esc(s.title)} · ${s.index + 1}/${s.items.length}</span></div>
    <div class="bar"><i style="width:${Math.round((s.index / s.items.length) * 100)}%"></i></div>
    <section class="card practice" style="margin-top:12px">
      <span class="pill">${item.type === "word" ? "Từ" : "Câu"}</span>
      <div class="target">${wordsHtml(item, r)}</div>
      ${item.ipa ? `<div class="ipa">${esc(item.ipa)}</div>` : ""}
      <div class="meaning">${esc(item.vi)}</div>
      ${s.sound ? `<p class="muted small" style="margin-top:8px">💡 ${esc(s.sound.how)}</p>` : ""}
      <div class="controls">
        <button class="round" id="play" title="Nghe mẫu">🔊</button>
        <button class="mic ${s.listening ? "listening" : ""}" id="mic" title="Bấm để nói" ${support.recognition ? "" : "disabled"}>${s.listening ? "⏹" : "🎤"}</button>
        <button class="round" id="slow" title="Nghe chậm">🐢</button>
      </div>
      <p class="muted small">${s.listening ? "Đang nghe… hãy đọc to và rõ." : "Bấm 🔊 để nghe mẫu, rồi bấm 🎤 và đọc theo. Chạm vào từng từ để nghe riêng từ đó."}</p>
      ${s.error ? `<div class="notice">${esc(s.error)}</div>` : ""}
      ${r ? `
        <div class="result">
          <div class="score ${v.tone}">${r.score}</div>
          <div class="stars">${"★".repeat(stars(r.score))}${"☆".repeat(3 - stars(r.score))}</div>
          <h3>${v.label} <span class="pill">+${r.xpGained} XP</span></h3>
          <p class="heard">Máy nghe được: “${esc(r.transcript || "…")}”</p>
          ${s.sound && item.contrast && r.words[0]?.heard === item.contrast ? `<div class="notice">Máy nghe thành “${esc(item.contrast)}”. Hãy chú ý sự khác nhau giữa hai âm nhé.</div>` : ""}
          <div class="legend"><span class="pill good">Rõ</span><span class="pill close">Gần đúng</span><span class="pill missed">Chưa nghe rõ</span></div>
          ${r.audioUrl ? `<p style="margin-top:10px"><button class="btn" id="replay">▶️ Nghe lại giọng mình</button><audio id="mine" src="${r.audioUrl}"></audio></p>` : ""}
          ${r.tips.length ? `<ul class="tips">${r.tips.map((t) => `<li><b>${esc(t.word)}</b>: ${esc(t.tip)}</li>`).join("")}</ul>` : ""}
        </div>` : ""}
      ${s.showTyped ? `
        <div class="typed"><input id="typed" placeholder="Không có micro? Gõ câu bạn đọc để thử"><button class="btn" id="typedGo">Chấm</button></div>` : ""}
      <div class="row" style="justify-content:center;margin-top:16px">
        ${r ? `<button class="btn" id="retry">↺ Thử lại</button>` : ""}
        <button class="btn ${r ? "primary" : "ghost"}" id="next">${s.index + 1 >= s.items.length ? "Hoàn thành" : r ? "Tiếp →" : "Bỏ qua →"}</button>
      </div>
      ${micNotice()}
    </section>`;

  $("#play").onclick = () => say(item.text);
  $("#slow").onclick = () => say(item.text, true);
  $$(".target .w").forEach((el) => (el.onclick = () => say(el.dataset.word, true)));
  $("#mic").onclick = () => (s.listening ? activeListen?.stop() : doListen());
  $("#next").onclick = nextItem;
  const retry = $("#retry");
  if (retry) retry.onclick = () => { revokeAudio(s.result?.audioUrl); s.result = null; s.error = null; renderPractice(); };
  const replay = $("#replay");
  if (replay) replay.onclick = () => $("#mine").play();
  const typedGo = $("#typedGo");
  if (typedGo) {
    const submit = () => { const val = $("#typed").value.trim(); if (val) applyResult([{ transcript: val, confidence: 1 }], null); };
    typedGo.onclick = submit;
    $("#typed").onkeydown = (e) => { if (e.key === "Enter") submit(); };
  }
}

async function doListen() {
  const s = session;
  stopSpeaking();
  s.listening = true;
  s.error = null;
  renderPractice();
  const index = s.index;
  const pending = listen({ lang: settings().accent, record: settings().keepRecording });
  activeListen = pending;
  try {
    const { alternatives, audioUrl } = await pending;
    if (session !== s || s.index !== index) return revokeAudio(audioUrl);
    s.listening = false;
    applyResult(alternatives, audioUrl);
  } catch (err) {
    s.listening = false;
    s.error = ERROR_TEXT[err?.code] || "Có lỗi khi nghe. Hãy thử lại.";
    if (["not-allowed", "service-not-allowed", "audio-capture", "network"].includes(err?.code)) s.showTyped = true;
    if (session === s && s.index === index && location.hash === "#/practice") renderPractice();
  } finally {
    if (activeListen === pending) activeListen = null;
  }
}

function applyResult(alternatives, audioUrl) {
  const s = session;
  const item = s.items[s.index];
  const r = bestScore(item.text, alternatives);
  const outcome = progress.recordAttempt(item.id, r.score);
  revokeAudio(s.result?.audioUrl);
  s.result = { ...r, audioUrl, xpGained: outcome.xpGained, tips: feedbackTips(r.words) };
  s.results[item.id] = Math.max(s.results[item.id] || 0, r.score);
  renderTopStats();
  renderPractice();
  celebrate(outcome);
}

function revokeAudio(url) {
  if (url) URL.revokeObjectURL(url);
}

function nextItem() {
  const s = session;
  stopSpeaking();
  activeListen?.stop();
  s.listening = false;
  revokeAudio(s.result?.audioUrl);
  if (s.index + 1 < s.items.length) {
    s.index += 1;
    s.result = null;
    s.error = null;
    renderPractice();
  } else {
    renderSummary();
  }
}

function renderSummary() {
  const s = session;
  const scores = Object.values(s.results);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  let bonus = null;
  if (s.daily && scores.length >= Math.ceil(s.items.length / 2)) bonus = progress.completeDaily();
  renderTopStats();
  const v = verdict(avg);
  view.innerHTML = `
    <section class="card practice">
      <h1>🎉 Hoàn thành!</h1>
      <p class="muted">${esc(s.title)}</p>
      <div class="score ${v.tone}" style="margin:16px auto">${avg}</div>
      <div class="stars">${"★".repeat(stars(avg))}${"☆".repeat(3 - stars(avg))}</div>
      <p>Bạn đã nói ${scores.length}/${s.items.length} mục. ${bonus && bonus.xpGained ? `Thử thách ngày: <b>+${bonus.xpGained} XP</b>!` : ""}</p>
      ${s.daily && !bonus ? `<p class="muted small">Nói ít nhất ${Math.ceil(s.items.length / 2)} mục để hoàn thành thử thách.</p>` : ""}
      <ul class="item-list">${s.items.map((i) => `<li><span>${esc(i.text)}</span>${s.results[i.id] !== undefined ? `<span class="pill ${s.results[i.id] >= 80 ? "good" : s.results[i.id] >= 50 ? "close" : "missed"}">${s.results[i.id]}</span>` : `<span class="pill">Bỏ qua</span>`}</li>`).join("")}</ul>
      <div class="row" style="justify-content:center;margin-top:14px">
        <button class="btn" id="again">↺ Luyện lại</button>
        <a class="btn primary" href="${s.back}">Xong</a>
      </div>
    </section>`;
  if (bonus) celebrate(bonus);
  $("#again").onclick = () => startSession({ ...s, start: 0 });
}

// ---------- sounds ----------
function renderSounds() {
  setTab("sounds");
  view.innerHTML = `
    <h1>Phòng luyện âm</h1>
    <p class="muted">Những âm người Việt hay gặp khó. Học cách đặt lưỡi, luyện nói và chơi trò “Nghe và chọn”.</p>
    <div class="grid" style="margin-top:12px">
      ${SOUNDS.map((snd) => {
        const m = mastery(snd.items);
        return `<a class="tile" href="#/sound/${snd.id}" style="--accent:#ec4899">
          <div class="row spread"><span class="icon">${snd.icon}</span><span class="pill">${m.done}/${m.total}</span></div>
          <h3>${esc(snd.title)}</h3><p class="muted small">${esc(snd.vi)}</p>
          <div class="bar"><i style="width:${m.pct}%"></i></div></a>`;
      }).join("")}
    </div>`;
}

function renderSound(id) {
  setTab("sounds");
  const snd = SOUNDS.find((x) => x.id === id);
  if (!snd) return go("#/sounds");
  view.innerHTML = `
    <a href="#/sounds" class="btn ghost">← Phòng âm</a>
    <section class="card">
      <h1>${snd.icon} ${esc(snd.title)}</h1>
      <p>${esc(snd.how)}</p>
      <div class="row"><button class="btn primary" id="speakAll">🎤 Luyện nói</button><a class="btn" href="#/listen/${snd.id}">👂 Nghe và chọn</a></div>
    </section>
    <h2 class="section-title">Cặp từ dễ nhầm</h2>
    <section class="card"><ul class="item-list">${snd.pairs.map(([a, b]) => `
      <li><button class="btn" data-say="${esc(a)}">🔊 ${esc(a)}</button><span class="muted">vs</span><button class="btn" data-say="${esc(b)}">🔊 ${esc(b)}</button></li>`).join("")}
    </ul></section>`;
  $$("[data-say]").forEach((b) => (b.onclick = () => say(b.dataset.say, true)));
  $("#speakAll").onclick = () => startSession({ title: snd.title, items: snd.items, back: `#/sound/${snd.id}`, sound: snd });
}

function newQuizRound() {
  const snd = SOUNDS.find((x) => x.id === quiz.soundId);
  const pair = snd.pairs[Math.floor(Math.random() * snd.pairs.length)];
  const options = Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]];
  quiz.current = { options, answer: pair[Math.floor(Math.random() * 2)] };
  quiz.picked = null;
}

function renderListen(id) {
  setTab("sounds");
  const snd = SOUNDS.find((x) => x.id === id);
  if (!snd) return go("#/sounds");
  if (!quiz || quiz.soundId !== id) { quiz = { soundId: id, round: 0, total: 8, correct: 0 }; newQuizRound(); }
  if (quiz.round >= quiz.total) {
    view.innerHTML = `
      <section class="card practice">
        <h1>👂 Kết quả</h1>
        <div class="score ${verdict((quiz.correct / quiz.total) * 100).tone}" style="margin:16px auto">${quiz.correct}/${quiz.total}</div>
        <div class="row" style="justify-content:center"><button class="btn" id="again">↺ Chơi lại</button><a class="btn primary" href="#/sound/${id}">Xong</a></div>
      </section>`;
    $("#again").onclick = () => { quiz = null; renderListen(id); };
    return;
  }
  const c = quiz.current;
  view.innerHTML = `
    <div class="row spread"><a href="#/sound/${id}" class="btn ghost">← ${esc(snd.title)}</a><span class="muted small">Câu ${quiz.round + 1}/${quiz.total} · Đúng ${quiz.correct}</span></div>
    <section class="card practice">
      <h2>Bạn nghe thấy từ nào?</h2>
      <div class="controls"><button class="mic" id="hear" style="background:linear-gradient(135deg,#4f46e5,#7c3aed)">🔊</button></div>
      <p class="muted small">Bấm loa để nghe (có thể nghe lại nhiều lần).</p>
      ${support.synthesis ? "" : `<div class="notice">Trình duyệt này không có giọng đọc, chưa chơi được trò này.</div>`}
      <div class="choices">${c.options.map((o) => {
        const cls = quiz.picked ? (o === c.answer ? "right" : o === quiz.picked ? "wrong" : "") : "";
        return `<button class="choice ${cls}" data-pick="${esc(o)}" ${quiz.picked ? "disabled" : ""}>${esc(o)}</button>`;
      }).join("")}</div>
      ${quiz.picked ? `<p style="margin-top:12px"><b>${quiz.picked === c.answer ? "Chính xác! 🎉" : `Chưa đúng, đó là “${esc(c.answer)}”.`}</b></p>
        <button class="btn primary" id="nextQ">Tiếp →</button>` : ""}
    </section>`;
  $("#hear").onclick = () => say(c.answer, true);
  $$("[data-pick]").forEach((b) => (b.onclick = () => {
    quiz.picked = b.dataset.pick;
    const ok = quiz.picked === c.answer;
    if (ok) quiz.correct += 1;
    const outcome = progress.recordListening(ok);
    renderTopStats();
    celebrate(outcome);
    renderListen(id);
  }));
  const nextQ = $("#nextQ");
  if (nextQ) nextQ.onclick = () => { quiz.round += 1; newQuizRound(); renderListen(id); if (quiz.round < quiz.total) say(quiz.current.answer, true); };
  if (quiz.round === 0 && !quiz.picked && !quiz.autoplayed) { quiz.autoplayed = true; say(c.answer, true); }
}

// ---------- role-play ----------
function renderRoleplays() {
  setTab("roleplay");
  view.innerHTML = `
    <h1>Hội thoại nhập vai</h1>
    <p class="muted">Nghe nhân vật nói, rồi chọn và nói một câu trả lời. Bạn có thể nói bất kỳ câu gợi ý nào.</p>
    <div class="grid" style="margin-top:12px">
      ${ROLEPLAYS.map((rp) => {
        const best = progress.state.roleplays[rp.id];
        return `<a class="tile" href="#/roleplay/${rp.id}" style="--accent:#f59e0b">
          <div class="row spread"><span class="icon">${rp.icon}</span>${best !== undefined ? `<span class="pill good">${best}</span>` : `<span class="pill">Mới</span>`}</div>
          <h3>${esc(rp.title)}</h3><p class="muted small">${esc(rp.vi)}</p></a>`;
      }).join("")}
    </div>`;
}

function startChat(rp) {
  chat = { id: rp.id, turn: 0, log: [], scores: [], result: null, listening: false, error: null, showTyped: !support.recognition, showVi: true };
  chat.log.push({ who: "bot", en: rp.turns[0].bot[0], vi: rp.turns[0].bot[1] });
  say(rp.turns[0].bot[0]);
}

function renderChat(id) {
  setTab("roleplay");
  const rp = ROLEPLAYS.find((x) => x.id === id);
  if (!rp) return go("#/roleplay");
  if (!chat || chat.id !== id) startChat(rp);
  const done = chat.turn >= rp.turns.length;
  const turn = rp.turns[chat.turn];
  const r = chat.result;
  view.innerHTML = `
    <div class="row spread"><a href="#/roleplay" class="btn ghost">← Hội thoại</a><label class="toggle small"><input type="checkbox" id="vi" ${chat.showVi ? "checked" : ""}> Hiện tiếng Việt</label></div>
    <section class="card"><h2>${rp.icon} ${esc(rp.title)}</h2><p class="muted">${esc(rp.intro)}</p></section>
    <div class="chat">${chat.log.map((m) => `
      <div class="bubble ${m.who}">${m.who === "bot" ? `<button class="btn ghost" style="padding:0 6px" data-say="${esc(m.en)}">🔊</button>` : ""}${esc(m.en)}${m.score !== undefined ? ` <span class="pill">${m.score}</span>` : ""}${chat.showVi && m.vi ? `<div class="vi">${esc(m.vi)}</div>` : ""}</div>`).join("")}
    </div>
    ${done ? renderChatEnd(rp) : `
    <section class="card practice" style="margin-top:14px">
      <h3>Lượt của bạn: chọn và nói một câu</h3>
      ${turn.replies.map(([en, vi], i) => `<button class="reply-option ${r && r.index === i ? "selected" : ""}" data-say="${esc(en)}"><b>${esc(en)}</b>${chat.showVi ? `<div class="muted small">${esc(vi)}</div>` : ""}</button>`).join("")}
      <div class="controls"><button class="mic ${chat.listening ? "listening" : ""}" id="mic" ${support.recognition ? "" : "disabled"}>${chat.listening ? "⏹" : "🎤"}</button></div>
      <p class="muted small">Chạm vào câu gợi ý để nghe mẫu. Bấm 🎤 rồi nói.</p>
      ${chat.error ? `<div class="notice">${esc(chat.error)}</div>` : ""}
      ${r ? `<div class="result"><div class="score ${verdict(r.result.score).tone}">${r.result.score}</div>
        <p class="heard">Máy nghe được: “${esc(r.result.transcript)}”</p>
        <div class="target" style="font-size:22px">${wordsHtml({ text: r.answer }, r.result)}</div></div>` : ""}
      ${chat.showTyped ? `<div class="typed"><input id="typed" placeholder="Không có micro? Gõ câu trả lời để thử"><button class="btn" id="typedGo">Gửi</button></div>` : ""}
      <div class="row" style="justify-content:center;margin-top:12px">
        ${r && r.result.score >= 50 ? `<button class="btn primary" id="continue">Tiếp tục →</button>` : ""}
        ${r && r.result.score < 50 ? `<button class="btn" id="skip">Bỏ qua lượt này</button>` : ""}
      </div>
    </section>`}`;
  $$("[data-say]").forEach((b) => (b.onclick = () => say(b.dataset.say)));
  $("#vi").onchange = (e) => { chat.showVi = e.target.checked; renderChat(id); };
  if (done) {
    const again = $("#again");
    if (again) again.onclick = () => { chat = null; renderChat(id); };
    return;
  }
  $("#mic").onclick = () => (chat.listening ? activeListen?.stop() : chatListen(rp));
  const typedGo = $("#typedGo");
  if (typedGo) {
    const submit = () => { const val = $("#typed").value.trim(); if (val) chatResult(rp, [{ transcript: val, confidence: 1 }]); };
    typedGo.onclick = submit;
    $("#typed").onkeydown = (e) => { if (e.key === "Enter") submit(); };
  }
  const cont = $("#continue");
  if (cont) cont.onclick = () => advanceChat(rp, true);
  const skip = $("#skip");
  if (skip) skip.onclick = () => advanceChat(rp, false);
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

async function chatListen(rp) {
  const c = chat;
  stopSpeaking();
  c.listening = true;
  c.error = null;
  renderChat(rp.id);
  const turn = c.turn;
  const pending = listen({ lang: settings().accent, record: false });
  activeListen = pending;
  try {
    const { alternatives } = await pending;
    if (chat !== c || c.turn !== turn) return;
    c.listening = false;
    chatResult(rp, alternatives);
  } catch (err) {
    c.listening = false;
    c.error = ERROR_TEXT[err?.code] || "Có lỗi khi nghe. Hãy thử lại.";
    if (["not-allowed", "service-not-allowed", "audio-capture", "network"].includes(err?.code)) c.showTyped = true;
    if (chat === c && c.turn === turn) renderChat(rp.id);
  } finally {
    if (activeListen === pending) activeListen = null;
  }
}

function chatResult(rp, alternatives) {
  const turn = rp.turns[chat.turn];
  chat.result = bestOfAnswers(turn.replies.map((x) => x[0]), alternatives);
  renderChat(rp.id);
}

function advanceChat(rp, accepted) {
  const turn = rp.turns[chat.turn];
  const r = chat.result;
  const [en, vi] = turn.replies[r ? r.index : 0];
  chat.log.push({ who: "me", en, vi, score: r ? r.result.score : 0 });
  chat.scores.push(accepted && r ? r.result.score : 0);
  chat.turn += 1;
  chat.result = null;
  chat.error = null;
  if (chat.turn < rp.turns.length) {
    const next = rp.turns[chat.turn];
    chat.log.push({ who: "bot", en: next.bot[0], vi: next.bot[1] });
    say(next.bot[0]);
  } else {
    const avg = Math.round(chat.scores.reduce((a, b) => a + b, 0) / chat.scores.length);
    chat.final = avg;
    const outcome = progress.recordRoleplay(rp.id, avg);
    chat.xp = outcome.xpGained;
    renderTopStats();
    celebrate(outcome);
  }
  renderChat(rp.id);
}

function renderChatEnd(rp) {
  return `<section class="card practice" style="margin-top:14px">
    <h2>🎬 Hết cảnh!</h2>
    <div class="score ${verdict(chat.final).tone}" style="margin:12px auto">${chat.final}</div>
    <p>Điểm trung bình cả đoạn hội thoại. <span class="pill">+${chat.xp} XP</span></p>
    <div class="row" style="justify-content:center"><button class="btn" id="again">↺ Diễn lại</button><a class="btn primary" href="#/roleplay">Cảnh khác</a></div>
  </section>`;
}

// ---------- me ----------
function renderMe() {
  setTab("me");
  const s = progress.state;
  const lv = levelInfo(s.xp);
  const week = [];
  let key = progress.today();
  for (let i = 0; i < 7; i++) { week.unshift(key); key = previousDayKey(key); }
  const dows = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  view.innerHTML = `
    <section class="card hero">
      <h1>${s.name ? esc(s.name) : "Hồ sơ của tôi"}</h1>
      <p class="muted">Lv ${lv.level} · ${lv.name} · ${s.xp} XP</p>
      <div class="bar"><i style="width:${Math.round(lv.progress * 100)}%"></i></div>
    </section>
    <section class="card">
      <div class="grid" style="grid-template-columns:repeat(3,1fr);text-align:center">
        <div><h2>${progress.currentStreak()}</h2><p class="muted small">Chuỗi ngày (kỷ lục ${s.streak.best})</p></div>
        <div><h2>${masteredCount(s)}</h2><p class="muted small">Mục thành thạo</p></div>
        <div><h2>${s.attempts}</h2><p class="muted small">Lần luyện nói</p></div>
      </div>
      <h3 style="margin-top:12px">7 ngày gần đây</h3>
      <div class="week">${week.map((d) => { const [y, m, dd] = d.split("-").map(Number); const dow = dows[new Date(y, m - 1, dd).getDay()]; return `<div class="d ${s.days[d] ? "on" : ""}">${dow}<br>${s.days[d] || 0}</div>`; }).join("")}</div>
    </section>
    <h2 class="section-title">Huy hiệu (${Object.keys(s.badges).length}/${BADGES.length})</h2>
    <div class="badges">${BADGES.map((b) => `<div class="badge ${s.badges[b.id] ? "" : "locked"}" title="${esc(b.desc)}"><div class="b-icon">${b.icon}</div><b>${esc(b.name)}</b><span class="muted small">${esc(b.desc)}</span></div>`).join("")}</div>
    <h2 class="section-title">Cài đặt</h2>
    <section class="card">
      <label class="field">Tên của bạn<input id="name" maxlength="30" value="${esc(s.name)}"></label>
      <label class="field">Giọng mẫu
        <select id="accent"><option value="en-US" ${s.settings.accent === "en-US" ? "selected" : ""}>Anh – Mỹ (US)</option><option value="en-GB" ${s.settings.accent === "en-GB" ? "selected" : ""}>Anh – Anh (UK)</option></select></label>
      <label class="field">Tốc độ đọc mẫu: <span id="rateVal">${s.settings.rate}</span><input id="rate" type="range" min="0.5" max="1.2" step="0.1" value="${s.settings.rate}"></label>
      <label class="field">Mục tiêu mỗi ngày (số lần nói)
        <select id="goal">${[5, 10, 20, 30].map((g) => `<option ${s.settings.dailyGoal === g ? "selected" : ""}>${g}</option>`).join("")}</select></label>
      <label class="toggle"><input type="checkbox" id="rec" ${s.settings.keepRecording ? "checked" : ""}> Ghi âm để nghe lại giọng mình</label>
      <p class="muted small">Nếu trên điện thoại micro không nhận giọng, hãy tắt tuỳ chọn ghi âm.</p>
      <div class="row"><button class="btn" id="test">🔊 Thử giọng mẫu</button><button class="btn ghost" id="reset">Xoá toàn bộ tiến độ</button></div>
    </section>
    <p class="muted small" style="text-align:center">Điểm dựa trên những gì trình duyệt nghe được, không phải chấm từng âm vị. Dữ liệu chỉ lưu trên máy này.</p>`;
  $("#name").onchange = (e) => { progress.setName(e.target.value); toast("Đã lưu tên"); };
  $("#accent").onchange = (e) => progress.updateSettings({ accent: e.target.value });
  $("#rate").oninput = (e) => { $("#rateVal").textContent = e.target.value; progress.updateSettings({ rate: Number(e.target.value) }); };
  $("#goal").onchange = (e) => progress.updateSettings({ dailyGoal: Number(e.target.value) });
  $("#rec").onchange = (e) => progress.updateSettings({ keepRecording: e.target.checked });
  $("#test").onclick = () => say("Hi! Let's practise speaking English together.");
  $("#reset").onclick = () => {
    if (confirm("Xoá toàn bộ XP, huy hiệu và tiến độ?")) { progress.reset(); renderTopStats(); renderMe(); toast("Đã xoá tiến độ"); }
  };
}

// ---------- router ----------
function go(hash) { location.hash = hash; }

function route() {
  activeListen?.stop();
  stopSpeaking();
  const [, name, id] = (location.hash || "#/home").split("/");
  renderTopStats();
  switch (name) {
    case "topics": renderTopics(); break;
    case "topic": renderTopic(id); break;
    case "practice": renderPractice(); break;
    case "sounds": renderSounds(); break;
    case "sound": renderSound(id); break;
    case "listen": quiz = null; renderListen(id); break;
    case "roleplay": id ? (chat = null, renderChat(id)) : renderRoleplays(); break;
    case "me": renderMe(); break;
    default: renderHome();
  }
  if (name !== "practice" && name !== "roleplay") window.scrollTo(0, 0);
  view.focus({ preventScroll: true });
}

window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
