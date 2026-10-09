(() => {
  "use strict";

  const app = document.getElementById("app");
  const SIZES = [5, 10, 20, 0]; // 0 = toutes
  const MODES = {
    training: { label: "Entraînement", help: "La correction et les explications s'affichent après chaque question." },
    exam: { label: "Examen", help: "Chronomètre, navigation libre entre les questions, correction à la fin." }
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
      mode: store.get("mode", "training")
    },
    quiz: null,      // { id, certification, questions }
    index: 0,
    answers: {},     // questionId -> [labels]
    checked: {},     // questionId -> CheckResponse (training)
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

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  }

  function setError(err) {
    state.error = err ? (err.message || String(err)) : null;
  }

  const current = () => state.quiz.questions[state.index];
  const selectedOf = (q) => state.answers[q.id] || [];
  const isTraining = () => state.settings.mode === "training";

  // ---------- actions ----------

  async function loadCertifications() {
    try {
      state.certifications = await api("GET", "/api/certifications");
      const known = state.certifications.some((c) => c.id === state.settings.certification);
      if (!known && state.certifications.length) state.settings.certification = state.certifications[0].id;
      setError(null);
    } catch (e) {
      setError(new Error("Impossible de charger les certifications. Vérifiez que l'application tourne toujours, puis rechargez la page."));
    }
    render();
  }

  async function startQuiz() {
    if (state.busy) return;
    const { certification, size, mode } = state.settings;
    store.set("certification", certification);
    store.set("size", size);
    store.set("mode", mode);
    state.busy = true;
    render();
    try {
      state.quiz = await api("POST", "/api/quizzes", { certification, size });
      Object.assign(state, {
        view: "quiz", index: 0, answers: {}, checked: {}, result: null,
        confirmFinish: false, reviewFilter: "mistakes", startedAt: Date.now()
      });
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
      state.checked[q.id] = await api("POST", `/api/quizzes/${state.quiz.id}/check`,
        { questionId: q.id, answers: selectedOf(q) });
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

  function unansweredCount() {
    return state.quiz.questions.filter((q) => selectedOf(q).length === 0).length;
  }

  async function finishQuiz(force) {
    if (state.busy) return;
    if (!force && !isTraining() && unansweredCount() > 0) {
      state.confirmFinish = true;
      render();
      return;
    }
    state.busy = true;
    try {
      state.result = await api("POST", `/api/quizzes/${state.quiz.id}/finish`, { answers: state.answers });
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
    state.view = "home";
    state.quiz = null;
    state.result = null;
    setError(null);
    render();
    window.scrollTo(0, 0);
  }

  async function shutdown() {
    try { await api("POST", "/api/shutdown"); } catch { /* le serveur est peut-être déjà arrêté */ }
    stopTimer();
    state.view = "stopped";
    render();
  }

  function startTimer() {
    stopTimer();
    timerHandle = setInterval(() => {
      const el = document.querySelector("[data-timer]");
      if (el) el.textContent = clock((Date.now() - state.startedAt) / 1000);
    }, 1000);
  }
  function stopTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  }

  // ---------- views ----------

  function errorBlock() {
    return state.error ? `<div class="error" role="alert">${esc(state.error)}</div>` : "";
  }

  function homeView() {
    const s = state.settings;
    const certs = state.certifications.map((c) => `
      <button type="button" role="radio" class="cert" data-cert="${esc(c.id)}" aria-checked="${c.id === s.certification}">
        <span class="cert-name">${esc(c.shortName)}</span>
        <span class="cert-full">${esc(c.fullName)}</span>
        <span class="cert-count">${plural(c.questionCount, "question", "questions")}</span>
      </button>`).join("");

    const sizes = SIZES.map((n) => `
      <button type="button" role="radio" data-size="${n}" aria-checked="${n === s.size}">${n === 0 ? "Toutes" : n}</button>`).join("");

    const modes = Object.entries(MODES).map(([key, m]) => `
      <button type="button" role="radio" data-mode="${key}" aria-checked="${key === s.mode}">${m.label}</button>`).join("");

    return `
      <h1>Sur quelle certification on s'entraîne&nbsp;?</h1>
      <p class="lede">Choisissez la certification, le nombre de questions et votre façon de travailler.</p>
      ${errorBlock()}
      <fieldset class="field">
        <legend>Certification</legend>
        <div class="cert-list" role="radiogroup" aria-label="Certification">${certs}</div>
      </fieldset>
      <fieldset class="field">
        <legend>Nombre de questions</legend>
        <div class="segmented" role="radiogroup" aria-label="Nombre de questions">${sizes}</div>
      </fieldset>
      <fieldset class="field">
        <legend>Mode</legend>
        <div class="segmented" role="radiogroup" aria-label="Mode">${modes}</div>
        <p class="mode-help">${MODES[s.mode].help}</p>
      </fieldset>
      <div class="home-actions">
        <button type="button" class="btn primary" data-action="start" ${state.busy || !s.certification ? "disabled" : ""}>
          Commencer le quiz
        </button>
        <button type="button" class="btn quiet" data-action="shutdown">Quitter l'application</button>
      </div>`;
  }

  function trackView() {
    const training = isTraining();
    return `<nav class="track" aria-label="Progression">${state.quiz.questions.map((q, i) => {
      const cls = [];
      const chk = state.checked[q.id];
      if (chk) cls.push(chk.correct ? "good" : "bad");
      else if (selectedOf(q).length) cls.push("answered");
      if (i === state.index) cls.push("current");
      const reachable = !training || i <= furthestReachable();
      const status = chk ? (chk.correct ? "juste" : "faux") : (selectedOf(q).length ? "répondue" : "sans réponse");
      return `<button type="button" class="${cls.join(" ")}" data-goto="${i}" ${reachable ? "" : "disabled"}
        aria-label="Question ${i + 1}, ${status}" ${i === state.index ? 'aria-current="step"' : ""}></button>`;
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
    const confirm = state.confirmFinish ? `
      <div class="notice pop" role="alert">
        <span>${plural(missing, "question est restée", "questions sont restées")} sans réponse et ${missing > 1 ? "compteront" : "comptera"} comme ${missing > 1 ? "fausses" : "fausse"}.</span>
        <span class="actions">
          <button type="button" class="btn" data-action="first-unanswered">Y retourner</button>
          <button type="button" class="btn primary" data-action="finish-force">Terminer quand même</button>
        </span>
      </div>` : "";

    return `
      <header class="topbar">
        <span class="cert-tag">${esc(state.quiz.certification.shortName)} <span class="timer">${MODES[state.settings.mode].label}</span></span>
        <span class="right">
          ${training ? "" : `<span class="timer" data-timer aria-label="Temps écoulé">${clock((Date.now() - state.startedAt) / 1000)}</span>`}
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
      </article>
      ${confirm}
      <div class="nav">
        <button type="button" class="btn" data-action="prev" ${state.index === 0 ? "disabled" : ""}>Précédente</button>
        ${primary}
      </div>
      <p class="hint-keys">Raccourcis : <kbd>${esc(q.choices[0]?.label)}</kbd>…<kbd>${esc(q.choices[q.choices.length - 1]?.label)}</kbd> pour répondre, <kbd>Entrée</kbd> pour valider, <kbd>←</kbd> <kbd>→</kbd> pour naviguer</p>`;
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
        <p class="score-line">${verdict}</p>
        <div class="bar" role="img" aria-label="${pct} % de bonnes réponses">
          <div class="fill ${fillCls}" style="width:${pct}%"></div>
          ${r.passMark != null ? `<div class="mark" style="left:${r.passMark}%"></div>` : ""}
        </div>
        ${r.passMark != null ? `<div class="bar-legend"><span style="left:${r.passMark}%">seuil ${r.passMark}&nbsp;%</span></div>` : ""}
      </div>
      <div class="results-actions">
        <button type="button" class="btn primary" data-action="start">Nouveau quiz ${esc(state.quiz.certification.shortName)}</button>
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

  function stoppedView() {
    return `
      <h1>Application arrêtée</h1>
      <p class="lede">Vous pouvez fermer cet onglet. Relancez <strong>launch_quiz.command</strong> pour vous entraîner à nouveau.</p>`;
  }

  function render() {
    const views = { home: homeView, quiz: quizView, result: resultView, stopped: stoppedView };
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
    if (d.filter) { state.reviewFilter = d.filter; render(); return; }
    if (d.choice) { toggleChoice(d.choice); return; }
    if (d.goto !== undefined) { goTo(Number(d.goto)); return; }
    switch (d.action) {
      case "start": startQuiz(); break;
      case "check": checkCurrent(); break;
      case "next": goTo(state.index + 1); break;
      case "prev": goTo(state.index - 1); break;
      case "finish": finishQuiz(false); break;
      case "finish-force": finishQuiz(true); break;
      case "first-unanswered":
        goTo(state.quiz.questions.findIndex((q) => selectedOf(q).length === 0)); break;
      case "leave": leaveQuiz(); break;
      case "shutdown": shutdown(); break;
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
