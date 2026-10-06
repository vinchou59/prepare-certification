import application.QuizRunner;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) throws Exception {
        Scanner scanner = new Scanner(System.in);
        QuizRunner runner = new QuizRunner(scanner);
        runner.run();
    }
}