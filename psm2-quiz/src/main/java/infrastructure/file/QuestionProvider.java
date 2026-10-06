package infrastructure.file;

import domain.model.Question;
import java.util.List;

public interface QuestionProvider {
    List<Question> loadQuestions();
}