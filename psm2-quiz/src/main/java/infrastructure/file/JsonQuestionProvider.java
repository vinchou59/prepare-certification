package infrastructure.file;

import domain.model.Question;

import java.util.List;

public class JsonQuestionProvider implements QuestionProvider {
    private final String filePath;

    public JsonQuestionProvider(String filePath) {
        this.filePath = filePath;
    }

    @Override
    public List<Question> loadQuestions() {
        return JsonQuestionRepository.loadQuestions(filePath);
    }
}