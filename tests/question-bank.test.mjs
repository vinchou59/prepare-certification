// Cohérence des banques de questions : openspec/specs/question-bank/spec.md
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const dataDir = new URL("../site/data/", import.meta.url);
const read = (name) => JSON.parse(readFileSync(new URL(name, dataDir), "utf8"));
const certifications = read("certifications.json");
// Les choix peuvent être mélangés : un texte ne doit pas désigner un autre choix par sa lettre
const LETTER_REFERENCE = /\b(options?|answers?|choices?|réponses?|choix)\s+[A-I]\b/i;

test("certifications.json : identifiants uniques et fichiers existants", () => {
  const files = readdirSync(dataDir);
  const ids = new Set();
  for (const c of certifications) {
    assert.ok(c.id && c.shortName && c.fullName && c.file, `entrée incomplète : ${JSON.stringify(c)}`);
    assert.ok(!ids.has(c.id), `identifiant en double : ${c.id}`);
    ids.add(c.id);
    assert.ok(files.includes(c.file), `fichier introuvable : ${c.file}`);
    assert.ok(c.passMark === null || (c.passMark > 0 && c.passMark <= 100), `seuil invalide : ${c.id}`);
  }
});

test("chaque fichier de questions est déclaré dans certifications.json", () => {
  const declared = new Set(certifications.map((c) => c.file));
  for (const f of readdirSync(dataDir).filter((f) => f.startsWith("questions_"))) {
    assert.ok(declared.has(f), `${f} n'est déclaré dans aucune certification`);
  }
});

for (const cert of certifications) {
  test(`banque ${cert.shortName} (${cert.file}) cohérente`, () => {
    const { questions } = read(cert.file);
    const problems = [];
    assert.ok(Array.isArray(questions) && questions.length > 0, "aucune question");
    const ids = new Set();
    const texts = new Set();
    for (const q of questions) {
      const where = `#${q.id}`;
      if (!Number.isInteger(q.id) || ids.has(q.id)) problems.push(`${where} : id absent ou en double`);
      ids.add(q.id);
      const key = String(q.question ?? "").replace(/\s+/g, " ").trim().toLowerCase();
      if (!key) problems.push(`${where} : texte vide`);
      else if (texts.has(key)) problems.push(`${where} : question en double`);
      texts.add(key);
      if (!Array.isArray(q.choices) || q.choices.length < 2) { problems.push(`${where} : moins de 2 choix`); continue; }
      const correct = q.choices.filter((c) => c.isCorrect === true).length;
      if (correct === 0) problems.push(`${where} : aucune bonne réponse`);
      if (q.expectedAnswers !== correct) problems.push(`${where} : expectedAnswers=${q.expectedAnswers} mais ${correct} choix corrects`);
      q.choices.forEach((c, i) => {
        const label = String.fromCharCode(65 + i);
        if (c.label !== label) problems.push(`${where} : lettre ${c.label} au lieu de ${label}`);
        if (!c.text || !c.text.trim()) problems.push(`${where} : choix ${c.label} sans texte`);
        else if (c.text.includes("\n")) problems.push(`${where} : choix ${c.label} sur plusieurs lignes`);
        if (!c.explanation || !c.explanation.trim()) problems.push(`${where} : choix ${c.label} sans explication`);
        for (const [field, value] of [["texte", c.text], ["explication", c.explanation]]) {
          if (LETTER_REFERENCE.test(value ?? "")) problems.push(`${where} : choix ${c.label}, ${field} cite une lettre (« ${value.match(LETTER_REFERENCE)[0]} »)`);
        }
      });
    }
    assert.deepEqual(problems, [], `Incohérences :\n${problems.join("\n")}`);
  });
}
