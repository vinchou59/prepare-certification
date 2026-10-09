package application.web;

import java.util.List;
import java.util.Map;

/** JSON payloads exchanged between the browser and the local server. */
public final class ApiModels {
    private ApiModels() {}

    public record CertificationView(String id, String shortName, String fullName, int questionCount, Integer passMark) {}

    public record StartRequest(String certification, Integer size) {}

    public record ChoiceView(String label, String text) {}

    public record QuestionView(int id, String question, int expectedAnswers, List<ChoiceView> choices) {}

    public record QuizView(String id, CertificationView certification, List<QuestionView> questions) {}

    public record CheckRequest(int questionId, List<String> answers) {}

    public record CorrectionView(String label, String text, boolean correct, String explanation) {}

    public record CheckResponse(boolean correct, List<CorrectionView> choices) {}

    public record FinishRequest(Map<String, List<String>> answers) {}

    public record ReviewItem(int id, String question, int expectedAnswers, boolean correct,
                             List<String> given, List<CorrectionView> choices) {}

    public record ResultView(int score, int total, long durationSeconds, Integer passMark, List<ReviewItem> review) {}

    public record ErrorView(String error) {}
}
