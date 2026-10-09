import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seededRandom, drawQuestions, normalizeAnswers, isCorrect,
  questionView, createQuiz, checkQuestion, finishQuiz
} from "../site/js/quiz-core.js";

const choice = (label, isCorrect, explanation = "x") => ({ label, text: `Choice ${label}`, isCorrect, explanation });
const q = (id, expectedAnswers, ...choices) => ({ id, question: `Question ${id}`, expectedAnswers, choices });
const sample = () => [
  q(1, 1, choice("A", true, "Because."), choice("B", false, "No.")),
  q(2, 2, choice("A", true), choice("B", true), choice("C", false))
];
const cert = { id: "PSM2", shortName: "PSM II", passMark: 85 };

test("tirage : taille fixe, sans doublon", () => {
  const pool = Array.from({ length: 63 }, (_, i) => q(i + 1, 1, choice("A", true)));
  const drawn = drawQuestions(pool, 10);
  assert.equal(drawn.length, 10);
  assert.equal(new Set(drawn.map((x) => x.id)).size, 10);
});

test("tirage : toutes les questions si taille absente, nulle ou trop grande", () => {
  const pool = sample();
  for (const size of [undefined, 0, -3, 99]) assert.equal(drawQuestions(pool, size).length, 2);
});

test("tirage reproductible avec la même graine", () => {
  const pool = Array.from({ length: 40 }, (_, i) => q(i + 1, 1, choice("A", true)));
  const ids = (s) => drawQuestions(pool, 10, seededRandom(s)).map((x) => x.id);
  assert.deepEqual(ids(42), ids(42));
  assert.notDeepEqual(ids(42), ids(43));
});

test("réponse juste : ordre, casse et doublons sans effet", () => {
  assert.equal(isCorrect(sample()[1], ["b", "A", "a"]), true);
  assert.deepEqual(normalizeAnswers([" a", null, "A", "c"]), ["A", "C"]);
});

test("réponse partielle, excédentaire ou absente : fausse", () => {
  const two = sample()[1];
  assert.equal(isCorrect(two, ["A"]), false);
  assert.equal(isCorrect(two, ["A", "B", "C"]), false);
  assert.equal(isCorrect(two, []), false);
});

test("la vue d'une question ne contient ni bonnes réponses ni explications", () => {
  const view = JSON.stringify(questionView(sample()[0]));
  assert.ok(!view.includes("isCorrect") && !view.includes("explanation") && !view.includes("Because"));
});

test("correction d'une question en mode Entraînement", () => {
  const quiz = createQuiz({ certification: cert, questions: sample(), random: seededRandom(1) });
  const res = checkQuestion(quiz, 1, ["a"]);
  assert.equal(res.correct, true);
  assert.equal(res.choices[0].explanation, "Because.");
  assert.throws(() => checkQuestion(quiz, 99, ["A"]));
});

test("fin de quiz : score, pourcentage, durée, seuil, question sans réponse", () => {
  const quiz = createQuiz({ certification: cert, questions: sample(), now: 0 });
  const r = finishQuiz(quiz, { 1: ["A"] }, 95_000);
  assert.equal(r.score, 1);
  assert.equal(r.total, 2);
  assert.equal(r.percent, 50);
  assert.equal(r.durationSeconds, 95);
  assert.equal(r.passMark, 85);
  const unanswered = r.review.find((x) => x.id === 2);
  assert.equal(unanswered.correct, false);
  assert.deepEqual(unanswered.given, []);
});

test("fin de quiz idempotente", () => {
  const quiz = createQuiz({ certification: cert, questions: sample(), now: 0 });
  const first = finishQuiz(quiz, { 1: ["A"], 2: ["A", "B"] }, 1000);
  const second = finishQuiz(quiz, {}, 5000);
  assert.equal(second, first);
  assert.equal(second.score, 2);
});
