import {
  seededRandom, createQuiz, checkQuestion, finishQuiz as computeResult, questionView,
  historyEntry, recordResult, questionsToRework, recentResults, examFormat
} from "./quiz-core.js";

(() => {
  "use strict";

  const app = document.getElementById("app");
  const SIZES = [5, 10, 20, 0]; // 0 = toutes
  const MODES = {
    training: { label: "Entraînement", help: "La correction et les explications s'affichent après chaque question." },
    exam: { label: "Examen", help: "Format de l'examen officiel, compte à rebours, navigation libre, correction à la fin." }
  };

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("quiz." + key); return v === null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("quiz." + key, JSON.stringify(value)); } catch { /* ignore */ }
    }
  };

  const state = {
    view: "home",
    certifications: [],
    settings: {
      certification: store.get("certification", null),
      size: store.get("size", 10),
      mode: store.get("mode", "training"),
      shuffle: store.get("shuffle", true)
    },
    quiz: null,      // { certification, questions } : vues sans les réponses
    share: false,
    history: (() => { const h = store.get("history", []); return Array.isArray(h) ? h : []; })(),
    confirmClear: false,
    index: 0,
    answers: {},     // questionId -> [labels]
    checked: {},     // questionId -> CheckResponse (training)
    flagged: {},     // questionId -> true (examen : à revoir)
    deadline: null,  // examen : heure de fin (ms)
    timeUp: false,
    startedAt: 0,
    confirmFinish: false,
    result: null,
    reviewFilter: "mistakes",
    error: null,
    busy: false
  };

  let timerHandle = null;

  // ---------- helpers ----------

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m} min ${String(s).padStart(2, "0")} s`;
  };
  const clock = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ---------- données ----------

  // ?seed=42 dans l'adresse rend le tirage reproductible
  const seedParam = new URLSearchParams(location.search).get("seed");
  const random = seedParam !== null && seedParam.trim() !== "" && Number.isFinite(Number(seedParam))
    ? seededRandom(Number(seedParam)) : Math.random;

  const banks = new Map(); // fichier -> questions, chargé au plus une fois par visite
  let quizModel = null;    // quiz complet (avec réponses), jamais affiché tel quel

  async function loadJson(file) {
    const res = await fetch(`data/${file}`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Fichier introuvable : data/${file}`);
    return res.json();
  }

  async function loadBank(file) {
    if (!banks.has(file)) {
      let data;
      try { data = await loadJson(file); }
      catch { throw new Error(`Impossible de charger le fichier de questions data/${file}.`); }
      if (!data || !Array.isArray(data.questions)) throw new Error(`Le fichier data/${file} est mal formé.`);
      banks.set(file, data.questions);
    }
    return banks.get(file);
  }

  function setError(err) {
    state.error = err ? (err.message || String(err)) : null;
  }

  const current = () => state.quiz.questions[state.index];
  const selectedOf = (q) => state.answers[q.id] || [];
  const isTraining = () => state.settings.mode === "training";

  // ---------- actions ----------

  async function loadCertifications() {
    let certs;
    try {
      certs = await loadJson("certifications.json");
    } catch {
      setError(new Error("Impossible de charger la liste des certifications (data/certifications.json). Rechargez la page."));
      render();
      return;
    }
    const errors = [];
    state.certifications = await Promise.all(certs.map(async (c) => {
      try { return { ...c, questionCount: (await loadBank(c.file)).length }; }
      catch (e) { errors.push(e.message); return { ...c, questionCount: null }; }
    }));
    const usable = state.certifications.filter((c) => c.questionCount);
    if (!usable.some((c) => c.id === state.settings.certification)) {
      state.settings.certification = usable.length ? usable[0].id : null;
    }
    setError(errors.length ? new Error(errors.join(" ")) : null);
    render();
  }

  // Questions à retravailler de la certification choisie, limitées à celles qui existent encore
  function reworkIds(cert) {
    if (!cert) return [];
    const bank = banks.get(cert.file) || [];
    const known = new Set(bank.map((q) => q.id));
    return questionsToRework(state.history, cert.id).filter((id) => known.has(id));
  }

  function saveHistory(history) {
    state.history = history;
    store.set("history", history); // sans effet si le stockage local est indisponible
  }

  async function startQuiz(questionIds = null) {
    if (state.busy) return;
    const { certification, size, mode } = state.settings;
    store.set("certification", certification);
    store.set("size", size);
    store.set("mode", mode);
    store.set("shuffle", state.settings.shuffle);
    state.busy = true;
    render();
    try {
      const cert = state.certifications.find((c) => c.id === certification);
      let questions = await loadBank(cert.file);
      if (questionIds) {
        const wanted = new Set(questionIds);
        questions = questions.filter((q) => wanted.has(q.id));
        if (!questions.length) throw new Error("Aucune question à retravailler pour cette certification.");
      }
      const exam = mode === "exam" ? examFormat(cert.exam, questions.length) : null;
      quizModel = createQuiz({
        certification: cert, questions, random, shuffle: state.settings.shuffle,
        size: exam ? exam.questions : questionIds ? 0 : size
      });
      state.quiz = { certification: cert, questions: quizModel.questions.map(questionView) };
      Object.assign(state, {
        view: "quiz", index: 0, answers: {}, checked: {}, flagged: {}, result: null,
        confirmFinish: false, reviewFilter: "mistakes", startedAt: Date.now(), timeUp: false
      });
      state.deadline = exam ? state.startedAt + exam.minutes * 60_000 : null;
      setError(null);
      startTimer();
    } catch (e) {
      setError(e);
    } finally {
      state.busy = false;
    }
    render();
    window.scrollTo(0, 0);
  }

  function toggleChoice(label) {
    const q = current();
    if (state.checked[q.id]) return;
    let sel = [...selectedOf(q)];
    if (q.expectedAnswers === 1) {
      sel = sel[0] === label ? [] : [label];
    } else if (sel.includes(label)) {
      sel = sel.filter((l) => l !== label);
    } else if (sel.length < q.expectedAnswers) {
      sel.push(label);
    } else {
      // remplace la plus ancienne sélection pour rester au nombre attendu
      sel = [...sel.slice(1), label];
    }
    state.answers[q.id] = sel;
    state.confirmFinish = false;
    render();
  }

  async function checkCurrent() {
    const q = current();
    if (state.busy || selectedOf(q).length !== q.expectedAnswers) return;
    state.busy = true;
    try {
      state.checked[q.id] = checkQuestion(quizModel, q.id, selectedOf(q));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      state.busy = false;
    }
    render();
  }

  function goTo(i) {
    if (i < 0 || i >= state.quiz.questions.length) return;
    state.index = i;
    state.confirmFinish = false;
    render();
    window.scrollTo({ top: 0 });
  }

  function flaggedCount() {
    return state.quiz.questions.filter((q) => state.flagged[q.id]).length;
  }

  // Première question sans réponse, sinon première question marquée
  function firstPendingIndex() {
    const qs = state.quiz.questions;
    const i = qs.findIndex((q) => selectedOf(q).length === 0);
    return i >= 0 ? i : qs.findIndex((q) => state.flagged[q.id]);
  }

  function unansweredCount() {
    return state.quiz.questions.filter((q) => selectedOf(q).length === 0).length;
  }

  async function finishQuiz(force) {
    if (state.busy) return;
    if (!force && !isTraining() && (unansweredCount() > 0 || flaggedCount() > 0)) {
      state.confirmFinish = true;
      render();
      return;
    }
    state.busy = true;
    try {
      state.result = computeResult(quizModel, state.answers);
      if (!quizModel.recorded) {
        quizModel.recorded = true;
        saveHistory(recordResult(state.history, historyEntry(state.result, {
          certificationId: state.quiz.certification.id, mode: state.settings.mode
        })));
      }
      state.view = "result";
      state.reviewFilter = state.result.score === state.result.total ? "all" : "mistakes";
      setError(null);
      stopTimer();
    } catch (e) {
      setError(e);
    } finally {
      state.busy = false;
    }
    render();
    window.scrollTo(0, 0);
  }

  function leaveQuiz() {
    stopTimer();
    state.deadline = null;
    state.timeUp = false;
    quizModel = null;
    state.view = "home";
    state.quiz = null;
    state.result = null;
    setError(null);
    render();
    window.scrollTo(0, 0);
  }

  // ---------- partage ----------

  const QR_SOURCES = [
    "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js",
    "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"
  ];
  let qrLoading = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      el.onload = resolve;
      el.onerror = () => { el.remove(); reject(new Error(src)); };
      document.head.appendChild(el);
    });
  }

  function loadQrLibrary() {
    if (typeof window.qrcode === "function") return Promise.resolve(window.qrcode);
    if (!qrLoading) {
      qrLoading = QR_SOURCES.reduce(
        (p, src) => p.catch(() => loadScript(src)),
        Promise.reject(new Error("start"))
      ).then(() => {
        if (typeof window.qrcode !== "function") throw new Error("QR indisponible");
        return window.qrcode;
      });
      qrLoading.catch(() => { qrLoading = null; });
    }
    return qrLoading;
  }

  // Adresse à partager : la page d'accueil, sans paramètre ni ancre
  const shareUrl = () => location.origin + location.pathname;

  async function openShare() {
    state.share = { qr: null, failed: false, copied: false };
    render();
    try {
      const qrcode = await loadQrLibrary();
      const qr = qrcode(0, "M");
      qr.addData(shareUrl());
      qr.make();
      if (state.share) state.share.qr = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    } catch {
      if (state.share) state.share.failed = true;
    }
    render();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      if (state.share) state.share.copied = true;
    } catch {
      const input = document.querySelector("[data-share-url]");
      if (input) { input.focus(); input.select(); }
    }
    render();
  }

  const remainingSeconds = () => Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000));

  // Compte à rebours recalculé sur l'heure de fin : reste juste même après une mise en veille de l'onglet
  function tick() {
    if (state.view !== "quiz" || !state.deadline) return;
    const left = remainingSeconds();
    if (left <= 0) {
      stopTimer();
      state.timeUp = true;
      state.busy = false;
      finishQuiz(true);
      return;
    }
    const el = document.querySelector("[data-timer]");
    if (el) {
      el.textContent = clock(left);
      el.classList.toggle("urgent", left <= 60);
      el.setAttribute("aria-label", `Temps restant : ${clock(left)}`);
    }
  }

  function startTimer() {
    stopTimer();
    if (!state.deadline) return;
    timerHandle = setInterval(tick, 1000);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });

  function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  }

  // ---------- views ----------

  function errorBlock() {
    return state.error ? `<div class="error" role="alert">${esc(state.error)}</div>` : "";
  }

  function examFormatView(cert) {
    if (!cert || !cert.questionCount || !cert.exam) return "";
    const f = examFormat(cert.exam, cert.questionCount);
    return `
      <section class="field exam-format" aria-label="Format de l'examen">
        <h2 class="legend-like">Format de l'examen</h2>
        <div class="exam-facts">
          <span><strong>${f.questions}</strong> questions</span>
          <span><strong>${f.minutes}</strong> minutes</span>
          ${cert.passMark != null ? `<span>seuil <strong>${cert.passMark}&nbsp;%</strong></span>` : ""}
        </div>
        ${f.prorated ? `<p class="mode-help">L'examen officiel compte ${cert.exam.questions} questions en ${cert.exam.minutes} minutes ; la banque en contient ${cert.questionCount}, la durée est donc ajustée au prorata.</p>` : ""}
      </section>`;
  }

  function homeView() {
    const s = state.settings;
    const cert = state.certifications.find((c) => c.id === s.certification);
    const rework = reworkIds(cert);
    const certs = state.certifications.map((c) => `
      <button type="button" role="radio" class="cert" data-cert="${esc(c.id)}" aria-checked="${c.id === s.certification}" ${c.questionCount ? "" : "disabled"}>
        <span class="cert-name">${esc(c.shortName)}</span>
        <span class="cert-full">${esc(c.fullName)}</span>
        <span class="cert-count">${c.questionCount ? plural(c.questionCount, "question", "questions") : "indisponible"}</span>
      </button>`).join("");

    const sizes = SIZES.map((n) => `
      <button type="button" role="radio" data-size="${n}" aria-checked="${n === s.size}">${n === 0 ? "Toutes" : n}</button>`).join("");

    const modes = Object.entries(MODES).map(([key, m]) => `
      <button type="button" role="radio" data-mode="${key}" aria-checked="${key === s.mode}">${m.label}</button>`).join("");

    return `
      <h1>Sur quelle certification on s'entraîne&nbsp;?</h1>
      <p class="lede">Choisissez la certification et votre façon de travailler.</p>
      ${errorBlock()}
      <fieldset class="field">
        <legend>Certification</legend>
        <div class="cert-list" role="radiogroup" aria-label="Certification">${certs}</div>
      </fieldset>
      <fieldset class="field">
        <legend>Mode</legend>
        <div class="segmented" role="radiogroup" aria-label="Mode">${modes}</div>
        <p class="mode-help">${MODES[s.mode].help}</p>
      </fieldset>
      ${s.mode === "exam" ? examFormatView(cert) : `
      <fieldset class="field">
        <legend>Nombre de questions</legend>
        <div class="segmented" role="radiogroup" aria-label="Nombre de questions">${sizes}</div>
      </fieldset>`}
      <fieldset class="field">
        <legend>Ordre des réponses</legend>
        <div class="segmented" role="radiogroup" aria-label="Ordre des réponses">
          <button type="button" role="radio" data-shuffle="on" aria-checked="${s.shuffle}">Mélangé</button>
          <button type="button" role="radio" data-shuffle="off" aria-checked="${!s.shuffle}">Fixe</button>
        </div>
      </fieldset>
      <div class="home-actions">
        <button type="button" class="btn primary" data-action="start" ${state.busy || !s.certification ? "disabled" : ""}>
          ${s.mode === "exam" ? "Commencer l'examen" : "Commencer le quiz"}
        </button>
        ${rework.length ? `<button type="button" class="btn" data-action="rework-all" ${state.busy ? "disabled" : ""}>Retravailler mes erreurs (${rework.length})</button>` : ""}
        <button type="button" class="btn quiet" data-action="share">Partager</button>
      </div>
      ${shareView()}
      ${historyView(cert)}`;
  }

  function trackView() {
    const training = isTraining();
    return `<nav class="track" aria-label="Progression">${state.quiz.questions.map((q, i) => {
      const cls = [];
      const chk = state.checked[q.id];
      if (chk) cls.push(chk.correct ? "good" : "bad");
      else if (selectedOf(q).length) cls.push("answered");
      if (i === state.index) cls.push("current");
      if (state.flagged[q.id]) cls.push("flagged");
      const reachable = !training || i <= furthestReachable();
      const status = chk ? (chk.correct ? "juste" : "faux") : (selectedOf(q).length ? "répondue" : "sans réponse");
      return `<button type="button" class="${cls.join(" ")}" data-goto="${i}" ${reachable ? "" : "disabled"}
        aria-label="Question ${i + 1}, ${status}${state.flagged[q.id] ? ", marquée à revoir" : ""}" ${i === state.index ? 'aria-current="step"' : ""}></button>`;
    }).join("")}</nav>`;
  }

  // En entraînement on peut revenir en arrière, mais pas sauter au-delà de la première question non corrigée.
  function furthestReachable() {
    const qs = state.quiz.questions;
    for (let i = 0; i < qs.length; i++) if (!state.checked[qs[i].id]) return i;
    return qs.length - 1;
  }

  function choiceView(q, c, correction, selected) {
    const isSel = selected.includes(c.label);
    let cls = "choice";
    let extra = "";
    if (correction) {
      const corr = correction.choices.find((x) => x.label === c.label);
      if (corr.correct) {
        cls += " is-good";
        extra = `<div class="verdict">${isSel ? "Votre choix, correct" : "Bonne réponse, non cochée"}</div>`;
      } else if (isSel) {
        cls += " is-bad";
        extra = `<div class="verdict">Votre choix, incorrect</div>`;
      } else {
        cls += " is-dim";
      }
      if (corr.explanation) extra += `<div class="explain">${esc(corr.explanation)}</div>`;
    } else if (isSel) {
      cls += " selected";
    }
    const role = q.expectedAnswers === 1 ? "radio" : "checkbox";
    return `
      <button type="button" class="${cls}" role="${role}" aria-checked="${isSel}" data-choice="${esc(c.label)}" ${correction ? "disabled" : ""}>
        <span class="key" aria-hidden="true">${esc(c.label)}</span>
        <span class="choice-text">${esc(c.text)}${extra}</span>
      </button>`;
  }

  function quizView() {
    const qs = state.quiz.questions;
    const q = current();
    const sel = selectedOf(q);
    const training = isTraining();
    const correction = state.checked[q.id];
    const last = state.index === qs.length - 1;
    const need = q.expectedAnswers;
    const instruction = need === 1
      ? "Une seule réponse"
      : `Choisissez ${need} réponses (${sel.length} sur ${need})`;

    let primary;
    if (training) {
      if (!correction) {
        primary = `<button type="button" class="btn primary" data-action="check" ${sel.length !== need || state.busy ? "disabled" : ""}>Vérifier <kbd>Entrée</kbd></button>`;
      } else if (last) {
        primary = `<button type="button" class="btn primary" data-action="finish">Voir mon résultat <kbd>Entrée</kbd></button>`;
      } else {
        primary = `<button type="button" class="btn primary" data-action="next">Question suivante <kbd>Entrée</kbd></button>`;
      }
    } else {
      primary = last
        ? `<button type="button" class="btn primary" data-action="finish">Terminer l'examen</button>`
        : `<button type="button" class="btn primary" data-action="next">Suivante <kbd>→</kbd></button>`;
    }

    const metaRight = correction
      ? `<span class="feedback ${correction.correct ? "good" : "bad"} pop" role="status">${correction.correct ? "Bonne réponse" : "Pas tout à fait"}</span>`
      : `<span>${instruction}</span>`;

    const missing = unansweredCount();
    const flagged = flaggedCount();
    const confirm = state.confirmFinish ? `
      <div class="notice pop" role="alert">
        <span>${[
          missing ? `${plural(missing, "question est restée", "questions sont restées")} sans réponse et ${missing > 1 ? "compteront" : "comptera"} comme ${missing > 1 ? "fausses" : "fausse"}.` : "",
          flagged ? `${plural(flagged, "question est marquée", "questions sont marquées")} à revoir.` : ""
        ].filter(Boolean).join(" ")}</span>
        <span class="actions">
          <button type="button" class="btn" data-action="goto-pending">Y retourner</button>
          <button type="button" class="btn primary" data-action="finish-force">Terminer quand même</button>
        </span>
      </div>` : "";

    return `
      <header class="topbar">
        <span class="cert-tag">${esc(state.quiz.certification.shortName)} <span class="timer">${MODES[state.settings.mode].label}</span></span>
        <span class="right">
          ${training || !state.deadline ? "" : `<span class="timer${remainingSeconds() <= 60 ? " urgent" : ""}" data-timer aria-label="Temps restant : ${clock(remainingSeconds())}">${clock(remainingSeconds())}</span>`}
          <button type="button" class="btn quiet" data-action="leave">Abandonner</button>
        </span>
      </header>
      ${trackView()}
      ${errorBlock()}
      <article>
        <div class="q-meta">
          <span class="count">Question ${state.index + 1} sur ${qs.length}</span>
          ${metaRight}
        </div>
        <p class="q-text">${esc(q.question)}</p>
        <div class="choices" role="${need === 1 ? "radiogroup" : "group"}" aria-label="Réponses">
          ${q.choices.map((c) => choiceView(q, c, correction, sel)).join("")}
        </div>
        ${!training ? `
        <div class="q-tools">
          <button type="button" class="btn quiet flag-btn" data-action="toggle-flag" aria-pressed="${!!state.flagged[q.id]}">
            ${state.flagged[q.id] ? "Retirer la marque" : "Marquer pour revoir"}
          </button>
        </div>` : ""}
        ${correction ? reportLink(state.quiz.certification, q) : ""}
      </article>
      ${confirm}
      <div class="nav">
        <button type="button" class="btn" data-action="prev" ${state.index === 0 ? "disabled" : ""}>Précédente</button>
        ${primary}
      </div>
      <p class="hint-keys">Raccourcis : <kbd>${esc(q.choices[0]?.label)}</kbd>…<kbd>${esc(q.choices[q.choices.length - 1]?.label)}</kbd> pour répondre, <kbd>Entrée</kbd> pour valider, <kbd>←</kbd> <kbd>→</kbd> pour naviguer</p>`;
  }

  // Lien vers une issue GitHub pré-remplie ; sans lettres, car l'ordre des réponses peut changer
  const ISSUES_URL = "https://github.com/vinchou59/prepare-certification/issues/new";

  function reportLink(cert, q) {
    const text = String(q.question || "");
    const title = `[${cert.shortName}] Question ${q.id} : ${text.replace(/\s+/g, " ").slice(0, 60)}${text.length > 60 ? "…" : ""}`;
    const body = [
      `**Certification** : ${cert.shortName} (${cert.file})`,
      `**Question n°** : ${q.id}`,
      "",
      "> " + text.slice(0, 1000).replace(/\n/g, "\n> "),
      "",
      "**Réponses proposées** :",
      ...q.choices.map((c) => `- ${c.text}`),
      "",
      "**Problème constaté** :",
      "(bonne réponse discutable, explication incorrecte, faute de frappe…)"
    ].join("\n");
    const href = `${ISSUES_URL}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    return `<p class="report"><a href="${esc(href)}" target="_blank" rel="noopener" data-report>Signaler un problème</a></p>`;
  }

  function reviewItemView(item, number) {
    const correction = { choices: item.choices };
    const q = { expectedAnswers: item.expectedAnswers };
    return `
      <section class="review-item">
        <div class="q-meta">
          <span class="count">Question ${number}</span>
          <span class="badge ${item.correct ? "good" : "bad"}">${item.correct ? "Juste" : item.given.length ? "Fausse" : "Sans réponse"}</span>
        </div>
        <p class="q-text">${esc(item.question)}</p>
        <div class="choices">${item.choices.map((c) => choiceView(q, c, correction, item.given)).join("")}</div>
        ${reportLink(state.quiz.certification, item)}
      </section>`;
  }

  function resultView() {
    const r = state.result;
    const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
    const passed = r.passMark != null ? pct >= r.passMark : null;
    const fillCls = passed === null ? "" : passed ? "good" : "bad";
    const mistakes = r.review.filter((i) => !i.correct);

    let verdict = `<strong>${pct}&nbsp;%</strong> de bonnes réponses en ${formatDuration(r.durationSeconds)}.`;
    if (passed !== null) {
      verdict = passed
        ? `<strong class="good">${pct}&nbsp;%</strong>, au-dessus du seuil de ${r.passMark}&nbsp;% de l'examen officiel. Temps : ${formatDuration(r.durationSeconds)}.`
        : `<strong class="bad">${pct}&nbsp;%</strong>, sous le seuil de ${r.passMark}&nbsp;% de l'examen officiel. Temps : ${formatDuration(r.durationSeconds)}.`;
    }

    const items = r.review
      .map((item, i) => ({ item, n: i + 1 }))
      .filter(({ item }) => state.reviewFilter === "all" || !item.correct);

    const list = items.length
      ? items.map(({ item, n }) => reviewItemView(item, n)).join("")
      : `<p class="empty">Aucune erreur sur ce quiz. Affichez toutes les questions pour relire les explications.</p>`;

    return `
      <header class="topbar">
        <span class="cert-tag">${esc(state.quiz.certification.shortName)} <span class="timer">Résultat</span></span>
      </header>
      ${errorBlock()}
      <div class="score-block pop">
        <div class="score" aria-label="Score ${r.score} sur ${r.total}">${r.score}<span class="total">/${r.total}</span></div>
        ${state.timeUp ? `<p class="time-up">Temps écoulé : les questions sans réponse comptent comme fausses.</p>` : ""}
        <p class="score-line">${verdict}</p>
        <div class="bar" role="img" aria-label="${pct} % de bonnes réponses">
          <div class="fill ${fillCls}" style="width:${pct}%"></div>
          ${r.passMark != null ? `<div class="mark" style="left:${r.passMark}%"></div>` : ""}
        </div>
        ${r.passMark != null ? `<div class="bar-legend"><span style="left:${r.passMark}%">seuil ${r.passMark}&nbsp;%</span></div>` : ""}
      </div>
      <div class="results-actions">
        <button type="button" class="btn primary" data-action="start">Nouveau quiz ${esc(state.quiz.certification.shortName)}</button>
        ${mistakes.length ? `<button type="button" class="btn" data-action="rework-quiz">Retravailler ces erreurs (${mistakes.length})</button>` : ""}
        <button type="button" class="btn" data-action="leave">Changer de réglages</button>
      </div>
      <div class="review-head">
        <h2>Correction</h2>
        <div class="segmented" role="radiogroup" aria-label="Questions affichées">
          <button type="button" role="radio" data-filter="mistakes" aria-checked="${state.reviewFilter === "mistakes"}">Erreurs (${mistakes.length})</button>
          <button type="button" role="radio" data-filter="all" aria-checked="${state.reviewFilter === "all"}">Toutes (${r.total})</button>
        </div>
      </div>
      ${list}`;
  }

  const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  function historyView(cert) {
    if (!cert) return "";
    const recent = recentResults(state.history, cert.id);
    if (!recent.length) return "";
    const items = recent.map((e) => {
      const passed = cert.passMark != null ? e.percent >= cert.passMark : null;
      const cls = passed === null ? "" : passed ? "good" : "bad";
      let when = "";
      try { when = dateFormat.format(new Date(e.date)); } catch { /* date invalide */ }
      return `
        <li class="history-item">
          <span class="history-when">${esc(when)}<span class="history-mode">${esc(MODES[e.mode]?.label || "")}</span></span>
          <span class="history-score">${e.score}/${e.total}</span>
          <span class="history-pct ${cls}">${e.percent}&nbsp;%</span>
        </li>`;
    }).join("");
    const confirm = state.confirmClear ? `
        <div class="notice pop" role="alert">
          <span>Effacer tout l'historique et les questions à retravailler, pour toutes les certifications ?</span>
          <span class="actions">
            <button type="button" class="btn" data-action="clear-cancel">Annuler</button>
            <button type="button" class="btn primary" data-action="clear-confirm">Effacer</button>
          </span>
        </div>` : "";
    return `
      <section class="history" aria-label="Derniers résultats">
        <div class="history-head">
          <h2>Mes derniers résultats ${esc(cert.shortName)}</h2>
          ${cert.passMark != null ? `<span class="history-pass">seuil ${cert.passMark}&nbsp;%</span>` : ""}
        </div>
        <ol class="history-list">${items}</ol>
        <p class="history-note">Enregistré sur cet appareil uniquement.
          <button type="button" class="btn quiet link" data-action="clear-history">Effacer mon historique</button>
        </p>
        ${confirm}
      </section>`;
  }

  function shareView() {
    const sh = state.share;
    if (!sh) return "";
    let qr;
    if (sh.qr) qr = `<div class="qr" role="img" aria-label="QR code menant au site">${sh.qr}</div>`;
    else if (sh.failed) qr = `<p class="share-note">Le QR code est indisponible pour le moment. Vous pouvez partager le lien ci-dessous.</p>`;
    else qr = `<p class="share-note">Génération du QR code…</p>`;
    return `
      <section class="share pop" aria-label="Partager le quiz">
        <h2>Partager le quiz</h2>
        <p class="share-note">Scannez ce QR code avec un téléphone, ou envoyez le lien.</p>
        ${qr}
        <div class="share-link">
          <input type="text" readonly value="${esc(shareUrl())}" data-share-url aria-label="Lien du site">
          <button type="button" class="btn primary" data-action="copy-link">${sh.copied ? "Lien copié" : "Copier le lien"}</button>
        </div>
        <button type="button" class="btn quiet" data-action="share-close">Fermer</button>
      </section>`;
  }

  function render() {
    const views = { home: homeView, quiz: quizView, result: resultView };
    const focusedKey = document.activeElement?.dataset?.choice;
    app.innerHTML = views[state.view]();
    if (focusedKey) app.querySelector(`[data-choice="${CSS.escape(focusedKey)}"]`)?.focus();
  }

  // ---------- events ----------

  app.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (!el || el.disabled) return;
    const d = el.dataset;
    if (d.cert) { state.settings.certification = d.cert; render(); return; }
    if (d.size !== undefined) { state.settings.size = Number(d.size); render(); return; }
    if (d.mode) { state.settings.mode = d.mode; render(); return; }
    if (d.shuffle) { state.settings.shuffle = d.shuffle === "on"; render(); return; }
    if (d.filter) { state.reviewFilter = d.filter; render(); return; }
    if (d.choice) { toggleChoice(d.choice); return; }
    if (d.goto !== undefined) { goTo(Number(d.goto)); return; }
    switch (d.action) {
      case "start": startQuiz(); break;
      case "rework-all": startQuiz(reworkIds(state.certifications.find((c) => c.id === state.settings.certification))); break;
      case "rework-quiz": startQuiz(state.result.review.filter((r) => !r.correct).map((r) => r.id)); break;
      case "clear-history": state.confirmClear = true; render(); break;
      case "clear-cancel": state.confirmClear = false; render(); break;
      case "clear-confirm": state.confirmClear = false; saveHistory([]); render(); break;
      case "check": checkCurrent(); break;
      case "next": goTo(state.index + 1); break;
      case "prev": goTo(state.index - 1); break;
      case "finish": finishQuiz(false); break;
      case "finish-force": finishQuiz(true); break;
      case "goto-pending": goTo(firstPendingIndex()); break;
      case "toggle-flag": {
        const id = current().id;
        if (state.flagged[id]) delete state.flagged[id]; else state.flagged[id] = true;
        state.confirmFinish = false;
        render();
        break;
      }
      case "leave": leaveQuiz(); break;
      case "share": openShare(); break;
      case "share-close": state.share = false; render(); break;
      case "copy-link": copyLink(); break;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (state.view !== "quiz" || e.metaKey || e.ctrlKey || e.altKey) return;
    const q = current();
    const key = e.key;
    if (/^[a-z]$/i.test(key)) {
      const label = key.toUpperCase();
      if (q.choices.some((c) => c.label === label)) { e.preventDefault(); toggleChoice(label); }
      return;
    }
    if (key === "Enter") {
      // Laisser Entrée activer normalement un bouton de navigation focalisé
      const focused = document.activeElement;
      if (focused?.dataset?.action || focused?.dataset?.goto !== undefined) return;
      e.preventDefault();
      const training = isTraining();
      const last = state.index === state.quiz.questions.length - 1;
      if (training && !state.checked[q.id]) checkCurrent();
      else if (last) finishQuiz(false);
      else goTo(state.index + 1);
      return;
    }
    if (key === "ArrowRight") {
      if (isTraining() && !state.checked[q.id]) return;
      if (state.index < state.quiz.questions.length - 1) goTo(state.index + 1);
    } else if (key === "ArrowLeft") {
      goTo(state.index - 1);
    }
  });

  render();
  loadCertifications();
})();
