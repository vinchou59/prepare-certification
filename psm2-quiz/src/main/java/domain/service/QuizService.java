package domain.service;

import domain.model.Choice;
import domain.model.Question;

import java.util.*;
import java.util.stream.Collectors;

public class QuizService {
    private final List<Question> selectedQuestions;
    private final Map<Question, List<String>> userAnswers = new LinkedHashMap<>();

    public QuizService(List<Question> allQuestions) {
        this(allQuestions, 5, new Random());
    }

    public QuizService(List<Question> allQuestions, int numberOfQuestions, Random random) {
        List<Question> pool = new ArrayList<>(Objects.requireNonNull(allQuestions, "allQuestions"));
        Collections.shuffle(pool, Objects.requireNonNull(random, "random"));
        int size = Math.max(0, Math.min(numberOfQuestions, pool.size()));
        this.selectedQuestions = new ArrayList<>(pool.subList(0, size));
    }

    public List<Question> getSelectedQuestions() {
        return selectedQuestions;
    }

    public void submitAnswer(Question question, List<String> selectedLabels) {
        userAnswers.put(question, selectedLabels);
    }

    public int calculateScore() {
        int score = 0;
        for (Map.Entry<Question, List<String>> entry : userAnswers.entrySet()) {
            List<String> correct = entry.getKey().getChoices().stream()
                    .filter(Choice::isCorrect)
                    .map(Choice::getLabel)
                    .sorted()
                    .collect(Collectors.toList());

            List<String> given = new ArrayList<>(entry.getValue());
            given.sort(String::compareTo);
            if (correct.equals(given)) score++;
        }
        return score;
    }

    public Map<Question, List<Choice>> getMistakes() {
        Map<Question, List<Choice>> mistakes = new LinkedHashMap<>();
        for (Map.Entry<Question, List<String>> entry : userAnswers.entrySet()) {
            Question q = entry.getKey();
            List<String> given = entry.getValue();
            List<String> correct = q.getChoices().stream()
                    .filter(Choice::isCorrect)
                    .map(Choice::getLabel)
                    .collect(Collectors.toList());
            if (!new HashSet<>(given).equals(new HashSet<>(correct))) {
                mistakes.put(q, q.getChoices().stream()
                        .filter(c -> correct.contains(c.getLabel()) || given.contains(c.getLabel()))
                        .collect(Collectors.toList()));
            }
        }
        return mistakes;
    }
}