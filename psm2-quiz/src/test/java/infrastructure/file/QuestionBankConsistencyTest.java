package infrastructure.file;

import domain.model.Certification;
import domain.model.Choice;
import domain.model.Question;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Vérifie la cohérence de toutes les banques de questions (spec openspec/specs/question-bank) :
 * ids uniques, pas de doublon, lettres dans l'ordre, nombre de bonnes réponses,
 * texte des choix sur une ligne et explication pour chaque choix.
 * Une question incohérente ne peut jamais être réussie : ce test empêche d'en livrer une.
 */
class QuestionBankConsistencyTest {

    @Test
    void everyQuestionBankIsConsistent() {
        List<String> problems = new ArrayList<>();
        for (Certification cert : Certification.values()) {
            List<Question> questions = new JsonQuestionProvider(cert.getFileName()).loadQuestions();
            String file = cert.getFileName();
            if (questions == null || questions.isEmpty()) {
                problems.add(file + " : aucune question");
                continue;
            }
            Set<Integer> ids = new HashSet<>();
            Set<String> texts = new HashSet<>();
            for (Question q : questions) {
                String where = file + " #" + q.getId();
                if (!ids.add(q.getId())) problems.add(where + " : id en double");
                if (q.getQuestion() == null || q.getQuestion().isBlank()) {
                    problems.add(where + " : texte vide");
                } else if (!texts.add(q.getQuestion().replaceAll("\\s+", " ").trim().toLowerCase())) {
                    problems.add(where + " : question en double");
                }
                List<Choice> choices = q.getChoices();
                if (choices == null || choices.size() < 2) {
                    problems.add(where + " : moins de 2 choix");
                    continue;
                }
                long correct = choices.stream().filter(Choice::isCorrect).count();
                if (correct == 0) problems.add(where + " : aucune bonne réponse");
                if (q.getExpectedAnswers() != correct) {
                    problems.add(where + " : expectedAnswers=" + q.getExpectedAnswers()
                            + " mais " + correct + " choix corrects");
                }
                for (int i = 0; i < choices.size(); i++) {
                    Choice c = choices.get(i);
                    String expectedLabel = String.valueOf((char) ('A' + i));
                    if (!expectedLabel.equals(c.getLabel())) {
                        problems.add(where + " : lettre " + c.getLabel() + " au lieu de " + expectedLabel);
                    }
                    if (c.getText() == null || c.getText().isBlank()) {
                        problems.add(where + " : choix " + c.getLabel() + " sans texte");
                    } else if (c.getText().contains("\n")) {
                        problems.add(where + " : choix " + c.getLabel() + " sur plusieurs lignes");
                    }
                    if (c.getExplanation() == null || c.getExplanation().isBlank()) {
                        problems.add(where + " : choix " + c.getLabel() + " sans explication");
                    }
                }
            }
        }
        assertTrue(problems.isEmpty(), "Banques de questions incohérentes :\n" + String.join("\n", problems));
    }
}
