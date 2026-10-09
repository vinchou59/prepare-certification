package application.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

/** End-to-end test of the HTTP API against the real question files. */
class QuizWebServerTest {

    private final ObjectMapper json = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder().proxy(HttpClient.Builder.NO_PROXY).build();
    private QuizWebServer server;
    private String base;

    @BeforeEach
    void start() throws Exception {
        server = new QuizWebServer(
                c -> new infrastructure.file.JsonQuestionProvider(c.getFileName()).loadQuestions(),
                new Random(42), Clock.systemUTC());
        int port = server.start(0);
        base = "http://127.0.0.1:" + port;
    }

    @AfterEach
    void stop() {
        server.stop();
    }

    private HttpResponse<String> get(String path) throws Exception {
        return http.send(HttpRequest.newBuilder(URI.create(base + path)).GET().build(),
                HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> post(String path, String body) throws Exception {
        return http.send(HttpRequest.newBuilder(URI.create(base + path))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(body)).build(),
                HttpResponse.BodyHandlers.ofString());
    }

    @Test
    void servesTheUi() throws Exception {
        HttpResponse<String> res = get("/");
        assertEquals(200, res.statusCode());
        assertTrue(res.body().contains("app.js"));
        assertEquals(200, get("/app.css").statusCode());
        assertEquals(404, get("/nope.js").statusCode());
    }

    @Test
    void listsAllCertificationsWithQuestionCounts() throws Exception {
        JsonNode certs = json.readTree(get("/api/certifications").body());
        assertEquals(5, certs.size());
        for (JsonNode c : certs) {
            assertTrue(c.get("questionCount").asInt() > 0, c.toString());
        }
    }

    @Test
    void fullQuizFlow_usesTheSelectedCertification() throws Exception {
        HttpResponse<String> created = post("/api/quizzes", "{\"certification\":\"PSK\",\"size\":3}");
        assertEquals(201, created.statusCode());
        JsonNode quiz = json.readTree(created.body());
        assertEquals("PSK", quiz.get("certification").get("id").asText());
        assertEquals(3, quiz.get("questions").size());
        assertFalse(quiz.toString().contains("isCorrect"), "answers must not leak to the browser");
        assertFalse(quiz.toString().contains("explanation"));

        String id = quiz.get("id").asText();
        int qid = quiz.get("questions").get(0).get("id").asInt();

        JsonNode check = json.readTree(post("/api/quizzes/" + id + "/check",
                "{\"questionId\":" + qid + ",\"answers\":[\"A\"]}").body());
        assertTrue(check.has("correct"));
        assertTrue(check.get("choices").get(0).has("explanation"));

        JsonNode result = json.readTree(post("/api/quizzes/" + id + "/finish",
                "{\"answers\":{\"" + qid + "\":[\"A\"]}}").body());
        assertEquals(3, result.get("total").asInt());
        assertEquals(3, result.get("review").size());
    }

    @Test
    void rejectsUnknownCertificationAndQuiz() throws Exception {
        assertEquals(400, post("/api/quizzes", "{\"certification\":\"NOPE\"}").statusCode());
        assertEquals(404, post("/api/quizzes/unknown/finish", "{}").statusCode());
    }
}
