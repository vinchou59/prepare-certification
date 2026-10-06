package infrastructure.file;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;

import domain.model.Question;
import domain.model.QuestionListWrapper;

public class JsonQuestionRepository {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public static List<Question> loadQuestions(String filePath) {
        try (InputStream inputStream = JsonQuestionRepository.class
                .getClassLoader()
                .getResourceAsStream(filePath)) {

            if (inputStream == null) {
                throw new RuntimeException("❌ Resource not found: " + filePath);
            }

            QuestionListWrapper wrapper = OBJECT_MAPPER.readValue(inputStream, QuestionListWrapper.class);
            return wrapper.getQuestions();
        } catch (IOException e) {
            throw new RuntimeException("❌ Failed to load questions from '" + filePath + "': " + e.getMessage(), e);
        }
    }
}