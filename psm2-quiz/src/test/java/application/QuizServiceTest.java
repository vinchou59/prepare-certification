package application;

import domain.model.Choice;
import domain.model.Question;
import domain.service.QuizService;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class QuizServiceTest {

    @Test
    void testCalculateScore_WithCorrectAnswer() {
        Question question = new Question();
        question.setExpectedAnswers(2);
        question.setQuestion("Which two are Scrum values?");
        Choice a = new Choice("A", "Courage", true, "");
        Choice b = new Choice("B", "Commitment", true, "");
        Choice c = new Choice("C", "Control", false, "");

        question.setChoices(List.of(a, b, c));

        QuizService service = new QuizService(List.of(question));
        service.submitAnswer(question, List.of("A", "B"));

        assertEquals(1, service.calculateScore());
    }

    @Test
    void testCalculateScore_WithWrongAnswer() {
        Question question = new Question();
        question.setExpectedAnswers(1);
        question.setQuestion("Which is NOT a Scrum value?");
        Choice a = new Choice("A", "Focus", true, "");
        Choice b = new Choice("B", "Chaos", false, "");

        question.setChoices(List.of(a, b));

        QuizService service = new QuizService(List.of(question));
        service.submitAnswer(question, List.of("B"));

        assertEquals(0, service.calculateScore());
    }

    @Test
    void testCalculateScore_WithCorrectAnswersDifferentOrder() {
        Question question = new Question();
        question.setExpectedAnswers(2);
        question.setQuestion("Pick two correct.");
        Choice a = new Choice("A", "Alpha", true, "");
        Choice b = new Choice("B", "Beta", true, "");
        Choice c = new Choice("C", "Gamma", false, "");

        question.setChoices(List.of(a, b, c));

        QuizService service = new QuizService(List.of(question));
        service.submitAnswer(question, List.of("B", "A")); // order doesn't matter

        assertEquals(1, service.calculateScore());
    }

    @Test
    void testCalculateScore_WithPartialAnswer() {
        Question question = new Question();
        question.setExpectedAnswers(2);
        question.setQuestion("Pick two correct.");
        Choice a = new Choice("A", "Alpha", true, "");
        Choice b = new Choice("B", "Beta", true, "");
        Choice c = new Choice("C", "Gamma", false, "");

        question.setChoices(List.of(a, b, c));

        QuizService service = new QuizService(List.of(question));
        service.submitAnswer(question, List.of("A")); // partial = wrong

        assertEquals(0, service.calculateScore());
    }
    
    @Test
    void testGetSelectedQuestions_ReturnsCorrectList() {
    	Question q1 = new Question();
        q1.setId(1);
        q1.setQuestion("Question 1");

        Question q2 = new Question();
        q2.setId(2);
        q2.setQuestion("Question 2");

        List<Question> inputQuestions = new ArrayList<>(List.of(q1, q2));
        QuizService service = new QuizService(inputQuestions);

        List<Question> returned = service.getSelectedQuestions();

        assertEquals(2, returned.size());
        assertTrue(returned.containsAll(List.of(q1, q2)));
    }
}