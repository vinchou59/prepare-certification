import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createQuiz, finishQuiz, historyEntry, recordResult, questionsToRework, recentResults, HISTORY_LIMIT
} from "../site/js/quiz-core.js";

const choice = (label, isCorrect) => ({ label, text: label, isCorrect, explanation: "x" });
const q = (id) => ({ id, question: `Q${id}`, expectedAnswers: 1, choices: [choice("A", true), choice("B", false)] });
const cert = { id: "PSK", passMark: 85 };

function play(ids, answers, certificationId = "PSK", mode = "training", date = "2026-10-09T10:00:00Z") {
  const quiz = createQuiz({ certification: { ...cert, id: certificationId }, questions: ids.map(q), now: 0 });
  return historyEntry(finishQuiz(quiz, answers, 60_000), { certificationId, mode, date });
}

test("une entrée d'historique résume le quiz et le résultat de chaque question", () => {
  const e = play([1, 2, 3], { 1: ["A"], 2: ["B"] });
  assert.equal(e.score, 1);
  assert.equal(e.total, 3);
  assert.equal(e.percent, 33);
  assert.equal(e.durationSeconds, 60);
  assert.deepEqual(e.results, { 1: true, 2: false, 3: false });
});

test("l'historique garde les plus récents d'abord, dans la limite", () => {
  let h = [];
  for (let i = 0; i < HISTORY_LIMIT + 5; i++) h = recordResult(h, { n: i, certification: "PSK", results: {} });
  assert.equal(h.length, HISTORY_LIMIT);
  assert.equal(h[0].n, HISTORY_LIMIT + 4);
  assert.deepEqual(recordResult(null, { n: 1 }), [{ n: 1 }]);
});

test("une question ratée est à retravailler, puis en sort une fois réussie", () => {
  let h = recordResult([], play([1, 2, 3], { 1: ["A"], 2: ["B"] }));      // 2 fausse, 3 sans réponse
  assert.deepEqual(questionsToRework(h, "PSK").sort(), [2, 3]);
  h = recordResult(h, play([2], { 2: ["A"] }));                           // 2 réussie
  assert.deepEqual(questionsToRework(h, "PSK"), [3]);
  h = recordResult(h, play([1], { 1: ["B"] }));                           // 1 ratée à son tour
  assert.deepEqual(questionsToRework(h, "PSK").sort(), [1, 3]);
});

test("les questions à retravailler sont propres à chaque certification", () => {
  const h = recordResult([], play([1], { 1: ["B"] }, "PSM2"));
  assert.deepEqual(questionsToRework(h, "PSK"), []);
  assert.deepEqual(questionsToRework(h, "PSM2"), [1]);
});

test("derniers résultats d'une certification, entrées invalides ignorées", () => {
  let h = [null, { certification: "PSK", score: 0 }];
  for (let i = 0; i < 12; i++) h = recordResult(h, { certification: i % 2 ? "PSK" : "PSM2", n: i });
  const recent = recentResults(h, "PSK");
  assert.equal(recent.length, 7);
  assert.equal(recent[0].n, 11);
  assert.deepEqual(questionsToRework(h, "PSK"), []);
});
