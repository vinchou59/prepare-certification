package application.web;

import application.web.ApiModels.*;
import domain.model.Certification;
import domain.model.Choice;
import domain.model.Question;
import domain.service.QuizService;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

/** One quiz in progress, as seen by the browser. Wraps the domain QuizService. */
public class QuizSession {
    private final String id;
    private final Certification certification;
    private final QuizService service;
    private final Clock clock;
    private final Instant startedAt;
    private ResultView result;

    public QuizSession(String id, Certification certification, QuizService service, Clock clock) {
        this.id = id;
        this.certification = certification;
        this.service = service;
        this.clock = clock;
        this.startedAt = clock.instant();
    }

    public String getId() { return id; }
    public Certification getCertification() { return certification; }

    public List<QuestionView> questionViews() {
        return service.getSelectedQuestions().stream()
                .map(q -> new QuestionView(q.getId(), q.getQuestion(), q.getExpectedAnswers(),
                        q.getChoices().stream().map(c -> new ChoiceView(c.getLabel(), c.getText())).toList()))
                .toList();
    }

    /** Corrects a single question without recording anything (training mode). */
    public synchronized CheckResponse check(int questionId, List<String> answers) {
        Question q = find(questionId);
        return new CheckResponse(isCorrect(q, answers), corrections(q));
    }

    /** Records every answer, scores the quiz and returns the full review. Idempotent. */
    public synchronized ResultView finish(Map<String, List<String>> answers) {
        if (result != null) return result;
        Map<String, List<String>> safe = answers == null ? Map.of() : answers;
        List<ReviewItem> review = new ArrayList<>();
        for (Question q : service.getSelectedQuestions()) {
            List<String> given = normalize(safe.get(String.valueOf(q.getId())));
            service.submitAnswer(q, given);
            review.add(new ReviewItem(q.getId(), q.getQuestion(), q.getExpectedAnswers(),
                    isCorrect(q, given), given, corrections(q)));
        }
        long seconds = Duration.between(startedAt, clock.instant()).toSeconds();
        result = new ResultView(service.calculateScore(), service.getSelectedQuestions().size(),
                seconds, certification.getPassMark(), review);
        return result;
    }

    private Question find(int questionId) {
        return service.getSelectedQuestions().stream()
                .filter(q -> q.getId() == questionId)
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Question " + questionId + " is not part of this quiz"));
    }

    private static boolean isCorrect(Question q, List<String> answers) {
        Set<String> expected = new HashSet<>();
        for (Choice c : q.getChoices()) if (c.isCorrect()) expected.add(c.getLabel());
        return expected.equals(new HashSet<>(normalize(answers)));
    }

    private static List<CorrectionView> corrections(Question q) {
        return q.getChoices().stream()
                .map(c -> new CorrectionView(c.getLabel(), c.getText(), c.isCorrect(), c.getExplanation()))
                .toList();
    }

    private static List<String> normalize(List<String> answers) {
        if (answers == null) return List.of();
        return answers.stream().filter(Objects::nonNull).map(s -> s.trim().toUpperCase()).distinct().toList();
    }
}
