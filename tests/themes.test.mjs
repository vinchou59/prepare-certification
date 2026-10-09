import { test } from "node:test";
import assert from "node:assert/strict";
import { filterByTheme, themeStats, weakThemes, questionView } from "../site/js/quiz-core.js";

const themes = [{ id: "a", label: "Alpha" }, { id: "b", label: "Bêta" }, { id: "c", label: "Gamma" }];
const questions = [
  { id: 1, theme: "a" }, { id: 2, theme: "a" }, { id: 3, theme: "a" },
  { id: 4, theme: "b" }, { id: 5, theme: "b" }, { id: 6, theme: "c" }
];
const p = (last) => ({ box: last ? 2 : 1, last, lastSeen: 0, attempts: 1 });

test("filtrer par thème ; sans thème, toutes les questions", () => {
  assert.deepEqual(filterByTheme(questions, "b").map((q) => q.id), [4, 5]);
  assert.equal(filterByTheme(questions, "").length, 6);
});

test("taux de réussite par thème sur le dernier résultat de chaque question vue", () => {
  const progress = new Map([[1, p(true)], [2, p(false)], [4, p(true)], [5, p(true)]]);
  const stats = themeStats(themes, questions, progress);
  assert.deepEqual(stats, [
    { id: "a", label: "Alpha", total: 3, seen: 2, correct: 1, percent: 50 },
    { id: "b", label: "Bêta", total: 2, seen: 2, correct: 2, percent: 100 },
    { id: "c", label: "Gamma", total: 1, seen: 0, correct: 0, percent: null }
  ]);
  assert.deepEqual(weakThemes(stats).map((s) => s.id), ["a", "b"], "du plus faible au plus solide, thèmes non vus exclus");
});

test("la vue d'une question transmet son thème", () => {
  const v = questionView({ id: 1, question: "Q", expectedAnswers: 1, theme: "a", choices: [{ label: "A", text: "x", isCorrect: true, explanation: "e" }] });
  assert.equal(v.theme, "a");
  assert.equal(JSON.stringify(v).includes("isCorrect"), false);
});
