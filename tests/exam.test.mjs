import { test } from "node:test";
import assert from "node:assert/strict";
import { examFormat } from "../site/js/quiz-core.js";

test("examen complet quand la banque est assez grande", () => {
  assert.deepEqual(examFormat({ questions: 30, minutes: 90 }, 61), { questions: 30, minutes: 90, prorated: false });
});

test("banque plus petite : toutes les questions, durée au prorata", () => {
  assert.deepEqual(examFormat({ questions: 45, minutes: 60 }, 40), { questions: 40, minutes: 53, prorated: true });
  assert.deepEqual(examFormat({ questions: 80, minutes: 60 }, 78), { questions: 78, minutes: 59, prorated: true });
  assert.deepEqual(examFormat({ questions: 40, minutes: 60 }, 10), { questions: 10, minutes: 15, prorated: true });
  assert.deepEqual(examFormat({ questions: 60, minutes: 60 }, 59), { questions: 59, minutes: 59, prorated: true });
});

test("quiz d'erreurs en examen : prorata sur les questions à retravailler, au moins une minute", () => {
  assert.deepEqual(examFormat({ questions: 30, minutes: 90 }, 4), { questions: 4, minutes: 12, prorated: true });
  assert.equal(examFormat({ questions: 80, minutes: 60 }, 1).minutes, 1);
});
