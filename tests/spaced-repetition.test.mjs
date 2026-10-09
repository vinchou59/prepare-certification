import { test } from "node:test";
import assert from "node:assert/strict";
import {
  questionProgress, isDue, dueAt, pickForReview, masterySummary, createQuiz, seededRandom,
  REVIEW_DELAYS_DAYS, MAX_BOX
} from "../site/js/quiz-core.js";

const DAY = 86_400_000;
const T0 = Date.parse("2026-10-01T10:00:00Z");
// historique : le plus récent d'abord, comme dans l'application
const entry = (day, results, certification = "PSK") =>
  ({ date: new Date(T0 + day * DAY).toISOString(), certification, results });
const q = (id) => ({ id, question: `Q${id}`, expectedAnswers: 1, choices: [] });

test("une bonne réponse fait monter d'une boîte, une erreur renvoie en boîte 1", () => {
  const history = [
    entry(3, { 1: true, 2: false }),
    entry(2, { 1: true, 2: true }),
    entry(1, { 1: true, 2: true }),
    entry(0, { 1: false }),
    entry(0, { 9: true }, "PSM2")
  ];
  const p = questionProgress(history, "PSK");
  assert.deepEqual(p.get(1), { box: 4, last: true, lastSeen: T0 + 3 * DAY, attempts: 4 });
  assert.equal(p.get(2).box, 1);
  assert.equal(p.get(2).last, false);
  assert.equal(p.has(9), false, "autre certification ignorée");
});

test("la boîte est plafonnée ; une question réussie dès la première fois va en boîte 2", () => {
  const history = Array.from({ length: 8 }, (_, i) => entry(7 - i, { 1: true }));
  assert.equal(questionProgress(history, "PSK").get(1).box, MAX_BOX);
  assert.equal(questionProgress([entry(0, { 1: true })], "PSK").get(1).box, 2);
});

test("échéance : une erreur est à revoir tout de suite, une question réussie après son délai", () => {
  const p = { box: 3, last: true, lastSeen: T0, attempts: 2 };
  assert.equal(dueAt(p), T0 + REVIEW_DELAYS_DAYS[3] * DAY);
  assert.equal(isDue(p, T0 + DAY), false);
  assert.equal(isDue(p, T0 + 3 * DAY), true);
  assert.equal(isDue({ box: 1, last: false, lastSeen: T0, attempts: 1 }, T0), true);
  assert.equal(isDue(undefined, T0), false);
});

test("l'entraînement choisit d'abord les erreurs, puis l'inédit, puis les révisions échues", () => {
  const questions = [1, 2, 3, 4, 5, 6].map(q);
  const now = T0 + 2 * DAY;
  const progress = new Map([
    [1, { box: 5, last: true, lastSeen: T0, attempts: 5 }],   // pas encore échue
    [2, { box: 2, last: true, lastSeen: T0, attempts: 1 }],   // échue (1 jour)
    [3, { box: 1, last: false, lastSeen: T0, attempts: 1 }],  // erreur
    [4, { box: 1, last: false, lastSeen: T0, attempts: 2 }]   // erreur
  ]); // 5 et 6 jamais vues
  for (let seed = 1; seed <= 20; seed++) {
    const ids = (n) => pickForReview(questions, n, progress, now, seededRandom(seed)).map((x) => x.id).sort();
    assert.deepEqual(ids(2), [3, 4]);
    assert.deepEqual(ids(4), [3, 4, 5, 6]);
    assert.deepEqual(ids(5), [2, 3, 4, 5, 6]);
    assert.deepEqual(ids(0), [1, 2, 3, 4, 5, 6]);
  }
});

test("sans historique, la sélection reste un tirage de questions distinctes", () => {
  const questions = Array.from({ length: 30 }, (_, i) => q(i + 1));
  const quiz = createQuiz({ certification: { id: "PSK" }, questions, size: 10, progress: new Map(), random: seededRandom(3) });
  assert.equal(new Set(quiz.questions.map((x) => x.id)).size, 10);
});

test("bilan de maîtrise d'une banque", () => {
  const questions = [1, 2, 3, 4, 5].map(q);
  const progress = new Map([
    [1, { box: 4, last: true, lastSeen: T0, attempts: 4 }],
    [2, { box: 2, last: true, lastSeen: T0, attempts: 1 }],
    [3, { box: 1, last: false, lastSeen: T0, attempts: 1 }]
  ]);
  assert.deepEqual(masterySummary(questions, progress, T0 + 2 * DAY),
    { total: 5, mastered: 1, learning: 1, errors: 1, unseen: 2, due: 2 });
});
