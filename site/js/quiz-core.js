// Logique du quiz, sans accès au DOM : importée par l'interface et par les tests Node.js.
// Règles : openspec/specs/quiz-scoring/spec.md

/** Générateur pseudo-aléatoire déterministe (mulberry32), pour les tirages reproductibles. */
export function seededRandom(seed) {
  let a = Number(seed) >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tire `size` questions distinctes au hasard ; toutes si size est absent, ≤ 0 ou trop grand. */
export function drawQuestions(questions, size, random = Math.random) {
  const pool = [...questions];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const n = !size || size <= 0 ? pool.length : Math.min(size, pool.length);
  return pool.slice(0, n);
}

/** Lettres en majuscules, sans doublon ni valeur vide. */
export function normalizeAnswers(answers) {
  if (!Array.isArray(answers)) return [];
  const seen = new Set();
  for (const a of answers) {
    if (a == null) continue;
    const l = String(a).trim().toUpperCase();
    if (l) seen.add(l);
  }
  return [...seen];
}

/** Juste si et seulement si l'ensemble des lettres choisies égale l'ensemble des bonnes réponses. */
export function isCorrect(question, answers) {
  const expected = question.choices.filter((c) => c.isCorrect).map((c) => c.label);
  const given = normalizeAnswers(answers);
  return given.length === expected.length && expected.every((l) => given.includes(l));
}

function corrections(question) {
  return question.choices.map((c) => ({
    label: c.label, text: c.text, correct: c.isCorrect, explanation: c.explanation
  }));
}

/** Vue d'une question sans les réponses : c'est tout ce que l'interface affiche avant correction. */
export function questionView(q) {
  return {
    id: q.id, question: q.question, expectedAnswers: q.expectedAnswers, theme: q.theme ?? null,
    choices: q.choices.map((c) => ({ label: c.label, text: c.text }))
  };
}

/**
 * Format d'un examen blanc : nombre de questions de l'examen officiel, plafonné aux questions disponibles,
 * et durée au prorata (même temps par question que l'examen officiel, au moins une minute).
 */
export function examFormat(exam, available) {
  const questions = Math.max(0, Math.min(exam.questions, available));
  const minutes = Math.max(1, Math.round((exam.minutes * questions) / exam.questions));
  return { questions, minutes, prorated: questions < exam.questions };
}

// Choix qui restent en dernière position quand on mélange : « All of the above », « None of the answers »…
const ANCHORED = /^\s*(all|none)\s+of\s+the\s+(above|answers)\b|^\s*all\s+answers\s+apply\b/i;
const TRUE_FALSE = new Set(["true", "false", "vrai", "faux"]);

export function isAnchoredChoice(choice) {
  return ANCHORED.test(choice.text);
}

/** Copie de la question avec ses choix mélangés et relettrés A, B, C… dans l'ordre affiché. */
export function shuffleChoices(question, random = Math.random) {
  const choices = question.choices;
  const trueFalse = choices.every((c) => TRUE_FALSE.has(c.text.trim().replace(/\.$/, "").toLowerCase()));
  if (trueFalse) return question;
  const movable = choices.filter((c) => !isAnchoredChoice(c));
  for (let i = movable.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [movable[i], movable[j]] = [movable[j], movable[i]];
  }
  const ordered = [...movable, ...choices.filter(isAnchoredChoice)];
  return { ...question, choices: ordered.map((c, i) => ({ ...c, label: String.fromCharCode(65 + i) })) };
}

/** `progress` (facultatif) : sélection par répétition espacée au lieu d'un tirage au hasard. */
export function createQuiz({ certification, questions, size, random = Math.random, now = Date.now(), shuffle = false, progress = null }) {
  let drawn = progress ? pickForReview(questions, size, progress, now, random) : drawQuestions(questions, size, random);
  if (shuffle) drawn = drawn.map((q) => shuffleChoices(q, random));
  return { certification, questions: drawn, startedAt: now, result: null };
}

/** Correction d'une seule question (mode Entraînement). */
export function checkQuestion(quiz, questionId, answers) {
  const q = quiz.questions.find((x) => x.id === questionId);
  if (!q) throw new Error(`La question ${questionId} ne fait pas partie de ce quiz.`);
  return { correct: isCorrect(q, answers), choices: corrections(q) };
}

/** Termine le quiz et calcule le résultat ; un second appel renvoie le même résultat. */
export function finishQuiz(quiz, answers = {}, now = Date.now()) {
  if (quiz.result) return quiz.result;
  const review = quiz.questions.map((q) => {
    const given = normalizeAnswers(answers[q.id] ?? answers[String(q.id)]);
    return {
      id: q.id, question: q.question, expectedAnswers: q.expectedAnswers, theme: q.theme ?? null,
      correct: isCorrect(q, given), given, choices: corrections(q)
    };
  });
  const score = review.filter((r) => r.correct).length;
  const total = review.length;
  quiz.result = {
    score, total,
    percent: total ? Math.round((score / total) * 100) : 0,
    durationSeconds: Math.max(0, Math.round((now - quiz.startedAt) / 1000)),
    passMark: quiz.certification.passMark ?? null,
    review
  };
  return quiz.result;
}

// ---------- Suivi de progression (openspec/specs/progress-tracking) ----------

export const HISTORY_LIMIT = 200;

/** Entrée d'historique à partir du résultat d'un quiz terminé. */
export function historyEntry(result, { certificationId, mode, date = new Date().toISOString() }) {
  return {
    date, certification: certificationId, mode,
    score: result.score, total: result.total, percent: result.percent,
    durationSeconds: result.durationSeconds,
    results: Object.fromEntries(result.review.map((r) => [String(r.id), r.correct]))
  };
}

/** Ajoute une entrée en tête de l'historique (le plus récent d'abord), dans la limite donnée. */
export function recordResult(history, entry, limit = HISTORY_LIMIT) {
  const list = Array.isArray(history) ? history : [];
  return [entry, ...list].slice(0, limit);
}

/** Identifiants des questions dont le dernier résultat enregistré est faux, pour une certification. */
export function questionsToRework(history, certificationId) {
  const latest = new Map();
  for (const entry of Array.isArray(history) ? history : []) {
    if (!entry || entry.certification !== certificationId || !entry.results) continue;
    for (const [id, ok] of Object.entries(entry.results)) {
      if (!latest.has(id)) latest.set(id, ok === true);
    }
  }
  return [...latest].filter(([, ok]) => !ok).map(([id]) => Number(id));
}

/** Derniers quiz d'une certification, du plus récent au plus ancien. */
export function recentResults(history, certificationId, limit = 10) {
  return (Array.isArray(history) ? history : [])
    .filter((e) => e && e.certification === certificationId)
    .slice(0, limit);
}

// ---------- Répétition espacée (openspec/specs/quiz-scoring, progress-tracking) ----------

const DAY = 86_400_000;
/** Délai avant la prochaine révision, en jours, selon la boîte (1 à 5) du système de Leitner. */
export const REVIEW_DELAYS_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
export const MAX_BOX = 5;
export const MASTERED_BOX = 4;

/**
 * Boîte de Leitner de chaque question d'une certification, reconstruite à partir de l'historique :
 * une bonne réponse fait monter d'une boîte (jusqu'à 5 ; boîte 2 si la question est réussie dès la première fois),
 * une erreur renvoie en boîte 1.
 * Renvoie une Map id -> { box, last (dernier résultat), lastSeen (ms), attempts }.
 */
export function questionProgress(history, certificationId) {
  const progress = new Map();
  const entries = (Array.isArray(history) ? history : [])
    .filter((e) => e && e.certification === certificationId && e.results);
  for (let i = entries.length - 1; i >= 0; i--) { // du plus ancien au plus récent
    const e = entries[i];
    const time = Date.parse(e.date);
    for (const [key, ok] of Object.entries(e.results)) {
      const id = Number(key);
      const p = progress.get(id) || { box: 0, last: null, lastSeen: 0, attempts: 0 };
      const good = ok === true;
      p.box = good ? Math.min(MAX_BOX, Math.max(2, p.box + 1)) : 1; // réussie d'emblée : boîte 2
      p.last = good;
      p.lastSeen = Number.isFinite(time) ? time : p.lastSeen;
      p.attempts += 1;
      progress.set(id, p);
    }
  }
  return progress;
}

/** Date (ms) à partir de laquelle une question vue doit être revue. */
export function dueAt(p) {
  return p.lastSeen + (REVIEW_DELAYS_DAYS[p.box] ?? 0) * DAY;
}

/** Une question est à réviser si elle a déjà été vue et que son délai de révision est écoulé. */
export function isDue(p, now = Date.now()) {
  return !!p && dueAt(p) <= now;
}

/**
 * Sélection pour l'entraînement : d'abord les erreurs à revoir, puis les questions jamais vues,
 * puis les autres questions arrivées à échéance, enfin celles dont la révision est la plus proche.
 * Le hasard départage chaque groupe ; les questions retenues sont ensuite présentées dans le désordre.
 */
export function pickForReview(questions, size, progress, now = Date.now(), random = Math.random) {
  const errors = [], unseen = [], due = [], later = [];
  for (const q of drawQuestions(questions, 0, random)) {
    const p = progress.get(q.id);
    if (!p) unseen.push(q);
    else if (p.box <= 1) errors.push(q);
    else if (isDue(p, now)) due.push(q);
    else later.push(q);
  }
  later.sort((a, b) => dueAt(progress.get(a.id)) - dueAt(progress.get(b.id)));
  const ordered = [...errors, ...unseen, ...due, ...later];
  const n = !size || size <= 0 ? ordered.length : Math.min(size, ordered.length);
  return drawQuestions(ordered.slice(0, n), 0, random);
}

/** Répartition des questions d'une banque : maîtrisées, en cours, à revoir (erreurs), jamais vues, et à réviser maintenant. */
export function masterySummary(questions, progress, now = Date.now()) {
  const s = { total: questions.length, mastered: 0, learning: 0, errors: 0, unseen: 0, due: 0 };
  for (const q of questions) {
    const p = progress.get(q.id);
    if (!p) { s.unseen++; continue; }
    if (p.box <= 1) s.errors++;
    else if (p.box >= MASTERED_BOX) s.mastered++;
    else s.learning++;
    if (isDue(p, now)) s.due++;
  }
  return s;
}

// ---------- Thèmes (openspec/specs/question-bank, progress-tracking) ----------

/** Questions d'un thème ; toutes si le thème est vide. */
export function filterByTheme(questions, themeId) {
  return themeId ? questions.filter((q) => q.theme === themeId) : questions;
}

/**
 * Taux de réussite par thème, sur le dernier résultat de chaque question déjà vue.
 * Renvoie les thèmes dans l'ordre déclaré : { id, label, total, seen, correct, percent (null si rien de vu) }.
 */
export function themeStats(themes, questions, progress) {
  return (themes || []).map((t) => {
    const qs = questions.filter((q) => q.theme === t.id);
    const seen = qs.filter((q) => progress.has(q.id));
    const correct = seen.filter((q) => progress.get(q.id).last === true).length;
    return {
      id: t.id, label: t.label, total: qs.length, seen: seen.length, correct,
      percent: seen.length ? Math.round((correct / seen.length) * 100) : null
    };
  });
}

/** Thèmes déjà travaillés, du plus faible au plus solide (à taux égal, le plus pratiqué d'abord). */
export function weakThemes(stats) {
  return stats.filter((s) => s.seen > 0)
    .sort((a, b) => a.percent - b.percent || b.seen - a.seen);
}
