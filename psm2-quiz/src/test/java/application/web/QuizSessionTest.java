package application.web;

import application.web.ApiModels.CheckResponse;
import application.web.ApiModels.ResultView;
import domain.model.Certification;
import domain.model.Choice;
import domain.model.Question;
import domain.service.QuizService;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

class QuizSessionTest {

    private static Question question(int id, int expected, Choice... choices) {
        Question q = new Question(id, "Question " + id, List.of(choices));
        q.setExpectedAnswers(expected);
        return q;
    }

    private static List<Question> sample() {
        return List.of(
                question(1, 1, new Choice("A", "Right", true, "Because."), new Choice("B", "Wrong", false, "No.")),
                question(2, 2, new Choice("A", "Right 1", true, ""), new Choice("B", "Right 2", true, ""),
                        new Choice("C", "Wrong", false, "")));
    }

    /** A clock that moves forward by the given step at each call. */
    private static Clock steppingClock(Duration step) {
        return new Clock() {
            private Instant now = Instant.parse("2026-01-01T10:00:00Z");
            @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
            @Override public Clock withZone(java.time.ZoneId zone) { return this; }
            @Override public Instant instant() { Instant t = now; now = now.plus(step); return t; }
        };
    }

    private QuizSession session() {
        return new QuizSession("s1", Certification.PSM2,
                new QuizService(sample(), 10, new Random(1)), steppingClock(Duration.ofSeconds(95)));
    }

    @Test
    void questionViews_doNotExposeCorrectAnswers() {
        var views = session().questionViews();
        assertEquals(2, views.size());
        assertEquals(2, views.get(0).choices().size());
        // ChoiceView only has label + text
        assertEquals(2, views.get(0).choices().get(0).getClass().getRecordComponents().length);
    }

    @Test
    void check_reportsCorrectnessAndExplanations_caseInsensitive() {
        CheckResponse ok = session().check(1, List.of("a"));
        assertTrue(ok.correct());
        assertEquals("Because.", ok.choices().get(0).explanation());

        CheckResponse ko = session().check(2, List.of("A", "C"));
        assertFalse(ko.correct());
    }

    @Test
    void check_unknownQuestion_throws() {
        assertThrows(java.util.NoSuchElementException.class, () -> session().check(99, List.of("A")));
    }

    @Test
    void finish_scoresAllQuestions_missingAnswersCountAsWrong() {
        ResultView r = session().finish(Map.of("1", List.of("A")));
        assertEquals(1, r.score());
        assertEquals(2, r.total());
        assertEquals(95, r.durationSeconds());
        assertEquals(Integer.valueOf(85), r.passMark());
        var q2 = r.review().stream().filter(i -> i.id() == 2).findFirst().orElseThrow();
        assertFalse(q2.correct());
        assertTrue(q2.given().isEmpty());
    }

    @Test
    void finish_isIdempotent() {
        QuizSession s = session();
        ResultView first = s.finish(Map.of("1", List.of("A"), "2", List.of("A", "B")));
        ResultView second = s.finish(Map.of());
        assertSame(first, second);
        assertEquals(2, second.score());
    }
}
