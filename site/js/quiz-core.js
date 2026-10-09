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
    id: q.id, question: q.question, expectedAnswers: q.expectedAnswers,
    choices: q.choices.map((c) => ({ label: c.label, text: c.text }))
  };
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

export function createQuiz({ certification, questions, size, random = Math.random, now = Date.now(), shuffle = false }) {
  let drawn = drawQuestions(questions, size, random);
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
      id: q.id, question: q.question, expectedAnswers: q.expectedAnswers,
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
