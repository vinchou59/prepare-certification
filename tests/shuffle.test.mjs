import { test } from "node:test";
import assert from "node:assert/strict";
import { shuffleChoices, createQuiz, finishQuiz, seededRandom, isCorrect } from "../site/js/quiz-core.js";

const c = (text, isCorrect = false) => ({ label: "?", text, isCorrect, explanation: `about ${text}` });
const lettered = (choices) => choices.map((x, i) => ({ ...x, label: String.fromCharCode(65 + i) }));
const q = (id, choices, expectedAnswers = 1) => ({ id, question: `Q${id}`, expectedAnswers, choices: lettered(choices) });

const five = q(1, [c("alpha"), c("beta", true), c("gamma"), c("delta"), c("epsilon")]);

test("les choix sont relettrés A, B, C… et gardent leur justesse et leur explication", () => {
  const s = shuffleChoices(five, seededRandom(3));
  assert.deepEqual(s.choices.map((x) => x.label), ["A", "B", "C", "D", "E"]);
  const beta = s.choices.find((x) => x.text === "beta");
  assert.equal(beta.isCorrect, true);
  assert.equal(beta.explanation, "about beta");
  assert.equal(isCorrect(s, [beta.label]), true);
  assert.equal(five.choices[1].label, "B", "la question d'origine n'est pas modifiée");
});

test("le mélange change l'ordre et reste reproductible avec la même graine", () => {
  const order = (seed) => shuffleChoices(five, seededRandom(seed)).choices.map((x) => x.text).join();
  assert.equal(order(7), order(7));
  const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(order));
  assert.ok(orders.size > 1);
});

test("« All of the answers » et « None of the above » restent en dernier, dans leur ordre", () => {
  const withAnchors = q(2, [c("one"), c("two"), c("three"), c("All of the above."), c("None of the above.")]);
  for (let seed = 1; seed <= 20; seed++) {
    const texts = shuffleChoices(withAnchors, seededRandom(seed)).choices.map((x) => x.text);
    assert.deepEqual(texts.slice(-2), ["All of the above.", "None of the above."]);
  }
  const one = q(3, [c("x"), c("y"), c("All of the answers.", true)]);
  assert.equal(shuffleChoices(one, seededRandom(1)).choices[2].text, "All of the answers.");
  const apply = q(4, [c("x"), c("y"), c("All answers apply.")]);
  assert.equal(shuffleChoices(apply, seededRandom(2)).choices[2].text, "All answers apply.");
});

test("les questions Vrai/Faux et True/False ne sont pas mélangées", () => {
  for (const pair of [["True", "False"], ["Faux", "Vrai"]]) {
    const tf = q(5, [c(pair[0], true), c(pair[1])]);
    for (let seed = 1; seed <= 10; seed++) assert.equal(shuffleChoices(tf, seededRandom(seed)), tf);
  }
});

test("un quiz mélangé se corrige avec les lettres affichées", () => {
  const quiz = createQuiz({ certification: { id: "X", passMark: null }, questions: [five], random: seededRandom(9), shuffle: true, now: 0 });
  const shown = quiz.questions[0];
  const right = shown.choices.find((x) => x.isCorrect).label;
  const result = finishQuiz(quiz, { 1: [right] }, 1000);
  assert.equal(result.score, 1);
  assert.equal(result.review[0].choices.find((x) => x.correct).label, right);
});
