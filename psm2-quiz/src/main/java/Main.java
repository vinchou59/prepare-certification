import application.web.QuizWebServer;

import java.awt.Desktop;
import java.awt.GraphicsEnvironment;
import java.net.URI;
import java.util.concurrent.CountDownLatch;

public class Main {
    public static void main(String[] args) throws Exception {
        int preferredPort = Integer.getInteger("quiz.port", 8765);
        boolean openBrowser = !Boolean.getBoolean("quiz.noBrowser");

        QuizWebServer server = new QuizWebServer();
        int port = server.start(preferredPort);
        String url = "http://localhost:" + port + "/";

        CountDownLatch stopped = new CountDownLatch(1);
        server.setOnShutdownRequested(stopped::countDown);
        Runtime.getRuntime().addShutdownHook(new Thread(server::stop));

        System.out.println("Quiz prêt sur " + url);
        System.out.println("Fermez cette fenêtre (ou Ctrl+C) pour arrêter l'application.");
        if (openBrowser) openInBrowser(url);

        stopped.await();
        Thread.sleep(200); // let the "bye" response reach the browser
        server.stop();
        System.exit(0);
    }

    private static void openInBrowser(String url) {
        try {
            if (!GraphicsEnvironment.isHeadless() && Desktop.isDesktopSupported()
                    && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(URI.create(url));
                return;
            }
            String os = System.getProperty("os.name", "").toLowerCase();
            if (os.contains("mac")) new ProcessBuilder("open", url).start();
            else if (os.contains("win")) new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", url).start();
            else new ProcessBuilder("xdg-open", url).start();
        } catch (Exception e) {
            System.out.println("Ouvrez cette adresse dans votre navigateur : " + url);
        }
    }
}
