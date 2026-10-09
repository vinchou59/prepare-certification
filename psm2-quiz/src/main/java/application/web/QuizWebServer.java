package application.web;

import application.web.ApiModels.*;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import domain.model.Certification;
import domain.model.Question;
import domain.service.QuizService;
import infrastructure.file.JsonQuestionProvider;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.BindException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Small local web server (JDK built-in, no extra dependency) serving the quiz UI and its JSON API.
 * It only listens on the loopback interface.
 */
public class QuizWebServer {
    private static final Pattern QUIZ_ACTION = Pattern.compile("^/api/quizzes/([\\w-]+)/(check|finish)$");
    private static final int MAX_SESSIONS = 50;

    private final ObjectMapper json = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    private final Function<Certification, List<Question>> questionLoader;
    private final Random random;
    private final Clock clock;
    private final Map<String, QuizSession> sessions = Collections.synchronizedMap(
            new LinkedHashMap<>(16, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, QuizSession> eldest) {
                    return size() > MAX_SESSIONS;
                }
            });
    private final Map<Certification, List<Question>> cache = new ConcurrentHashMap<>();
    private HttpServer server;
    private Runnable onShutdownRequested = () -> {};

    public QuizWebServer() {
        this(c -> new JsonQuestionProvider(c.getFileName()).loadQuestions(), seededRandom(), Clock.systemUTC());
    }

    public QuizWebServer(Function<Certification, List<Question>> questionLoader, Random random, Clock clock) {
        this.questionLoader = questionLoader;
        this.random = random;
        this.clock = clock;
    }

    private static Random seededRandom() {
        Long seed = Long.getLong("quiz.seed");
        return seed != null ? new Random(seed) : new Random();
    }

    /** Starts on the given port; if it is taken, falls back to any free port. Returns the actual port. */
    public int start(int preferredPort) throws IOException {
        InetAddress loopback = InetAddress.getLoopbackAddress();
        try {
            server = HttpServer.create(new InetSocketAddress(loopback, preferredPort), 0);
        } catch (BindException e) {
            server = HttpServer.create(new InetSocketAddress(loopback, 0), 0);
        }
        server.createContext("/", this::handle);
        server.setExecutor(Executors.newFixedThreadPool(4));
        server.start();
        return server.getAddress().getPort();
    }

    public void stop() {
        if (server != null) server.stop(0);
    }

    public void setOnShutdownRequested(Runnable onShutdownRequested) {
        this.onShutdownRequested = onShutdownRequested;
    }

    private void handle(HttpExchange ex) throws IOException {
        try {
            String path = ex.getRequestURI().getPath();
            String method = ex.getRequestMethod();
            if (path.startsWith("/api/")) {
                handleApi(ex, method, path);
            } else if ("GET".equals(method)) {
                serveStatic(ex, path);
            } else {
                sendJson(ex, 405, new ErrorView("Method not allowed"));
            }
        } catch (IllegalArgumentException | NoSuchElementException e) {
            sendJson(ex, 400, new ErrorView(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            sendJson(ex, 500, new ErrorView("Unexpected error: " + e.getMessage()));
        } finally {
            ex.close();
        }
    }

    private void handleApi(HttpExchange ex, String method, String path) throws IOException {
        if ("GET".equals(method) && path.equals("/api/certifications")) {
            sendJson(ex, 200, Arrays.stream(Certification.values()).map(this::view).toList());
            return;
        }
        if ("POST".equals(method) && path.equals("/api/quizzes")) {
            StartRequest req = json.readValue(ex.getRequestBody(), StartRequest.class);
            QuizSession session = startQuiz(req);
            sendJson(ex, 201, new QuizView(session.getId(), view(session.getCertification()), session.questionViews()));
            return;
        }
        if ("POST".equals(method) && path.equals("/api/shutdown")) {
            sendJson(ex, 200, Map.of("status", "bye"));
            onShutdownRequested.run();
            return;
        }
        Matcher m = QUIZ_ACTION.matcher(path);
        if ("POST".equals(method) && m.matches()) {
            QuizSession session = sessions.get(m.group(1));
            if (session == null) {
                sendJson(ex, 404, new ErrorView("Ce quiz n'existe plus. Relancez-en un depuis l'accueil."));
                return;
            }
            if (m.group(2).equals("check")) {
                CheckRequest req = json.readValue(ex.getRequestBody(), CheckRequest.class);
                sendJson(ex, 200, session.check(req.questionId(), req.answers()));
            } else {
                FinishRequest req = json.readValue(ex.getRequestBody(), FinishRequest.class);
                sendJson(ex, 200, session.finish(req.answers()));
            }
            return;
        }
        sendJson(ex, 404, new ErrorView("Unknown endpoint: " + method + " " + path));
    }

    QuizSession startQuiz(StartRequest req) {
        if (req == null || req.certification() == null) {
            throw new IllegalArgumentException("certification is required");
        }
        Certification cert;
        try {
            cert = Certification.valueOf(req.certification());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown certification: " + req.certification());
        }
        List<Question> pool = questions(cert);
        int size = req.size() == null || req.size() <= 0 ? pool.size() : req.size();
        QuizService service;
        synchronized (random) {
            service = new QuizService(pool, size, random);
        }
        QuizSession session = new QuizSession(UUID.randomUUID().toString(), cert, service, clock);
        sessions.put(session.getId(), session);
        return session;
    }

    private List<Question> questions(Certification cert) {
        return cache.computeIfAbsent(cert, questionLoader);
    }

    private CertificationView view(Certification c) {
        return new CertificationView(c.name(), c.getShortName(), c.getFullName(), questions(c).size(), c.getPassMark());
    }

    private void serveStatic(HttpExchange ex, String path) throws IOException {
        String resource = path.equals("/") ? "index.html" : path.substring(1);
        if (resource.contains("..")) {
            sendText(ex, 404, "Not found");
            return;
        }
        try (InputStream in = QuizWebServer.class.getClassLoader().getResourceAsStream("web/" + resource)) {
            if (in == null) {
                sendText(ex, 404, "Not found");
                return;
            }
            byte[] body = in.readAllBytes();
            ex.getResponseHeaders().set("Content-Type", contentType(resource));
            ex.getResponseHeaders().set("Cache-Control", "no-store");
            ex.sendResponseHeaders(200, body.length);
            try (OutputStream out = ex.getResponseBody()) {
                out.write(body);
            }
        }
    }

    private static String contentType(String resource) {
        if (resource.endsWith(".html")) return "text/html; charset=utf-8";
        if (resource.endsWith(".css")) return "text/css; charset=utf-8";
        if (resource.endsWith(".js")) return "text/javascript; charset=utf-8";
        if (resource.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    private void sendJson(HttpExchange ex, int status, Object payload) throws IOException {
        byte[] body = json.writeValueAsBytes(payload);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.sendResponseHeaders(status, body.length);
        try (OutputStream out = ex.getResponseBody()) {
            out.write(body);
        }
    }

    private void sendText(HttpExchange ex, int status, String text) throws IOException {
        byte[] body = text.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
        ex.sendResponseHeaders(status, body.length);
        try (OutputStream out = ex.getResponseBody()) {
            out.write(body);
        }
    }
}
