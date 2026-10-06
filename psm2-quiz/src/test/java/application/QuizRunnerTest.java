package application;

import org.junit.jupiter.api.Test;

import domain.model.Choice;
import domain.model.Question;
import domain.service.QuizService;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.time.Duration;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;

import static org.junit.jupiter.api.Assertions.*;

class QuizRunnerTest {

    @Test
    void testParseUserInput_SimpleLetters() {
        QuizRunner runner = new QuizRunner(null, new Scanner(System.in));
        List<String> result = runner.parseUserInput("A B C");
        assertEquals(List.of("A", "B", "C"), result);
    }

    @Test
    void testParseUserInput_WithCommasAndDots() {
        QuizRunner runner = new QuizRunner(null, new Scanner(System.in));
        List<String> result = runner.parseUserInput("A,B.C");
        assertEquals(List.of("A", "B", "C"), result);
    }

    @Test
    void testParseUserInput_WithDuplicates() {
        QuizRunner runner = new QuizRunner(null, new Scanner(System.in));
        List<String> result = runner.parseUserInput("A A B");
        assertEquals(List.of("A", "B"), result);
    }
    
    @Test
    void testPrintMistakes_DisplaysExpectedOutput() {
        // Préparer les données simulées
        Question question = new Question();
        question.setId(1);
        question.setQuestion("What is Scrum?");
        question.setExpectedAnswers(1);

        Choice choiceA = new Choice("A", "A correct choice", true, "It is correct.");
        Choice choiceB = new Choice("B", "An incorrect choice", false, "It is wrong.");

        question.setChoices(Arrays.asList(choiceA, choiceB));

        Map<Question, List<Choice>> mistakes = new HashMap<>();
        mistakes.put(question, Arrays.asList(choiceA, choiceB));

        List<Question> selected = List.of(question);

        // Rediriger System.out vers un flux mémoire
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        System.setOut(new PrintStream(out));

        // Appeler la méthode
        QuizRunner runner = new QuizRunner(null, new Scanner(System.in));
        runner.printMistakes(mistakes, selected);

        // Récupérer ce qui a été imprimé
        String output = out.toString();

        // Remettre System.out à la normale
        System.setOut(System.out);

        // Vérifications
        assertTrue(output.contains("Review Mistakes"));
        assertTrue(output.contains("Q1"));
        assertTrue(output.contains("✅ A: A correct choice"));
        assertTrue(output.contains("It is correct."));
        assertTrue(output.contains("❌ B: An incorrect choice"));
        assertTrue(output.contains("It is wrong."));
    }
    
    @Test
    void testPrintFinalScore_DisplaysExpectedOutput() {
        QuizRunner runner = new QuizRunner(null, new Scanner(System.in));

        int score = 4;
        int total = 5;
        Duration duration = Duration.ofMinutes(2).plusSeconds(45); // 2min 45s

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        System.setOut(new PrintStream(out));

        runner.printFinalScore(score, total, duration);

        String output = out.toString();
        System.setOut(System.out); // Reset System.out

        assertTrue(output.contains("Quiz completed"));
        assertTrue(output.contains("Score: 4/5"));
        assertTrue(output.contains("🕒 Time : 2 min 45 sec"));
    }
    
    @Test
    void testPrintWrapped_LinesAreWrappedCorrectly() {
        QuizRunner runner = new QuizRunner(null, new Scanner(System.in));
        int width = 40;

        String input = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
                + "Curabitur euismod ligula sit amet magna mattis, "
                + "nec fermentum lacus tincidunt.";

        // Capture System.out
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        System.setOut(new PrintStream(out));

        runner.printWrapped(input, width);

        // Reset console output
        System.setOut(System.out);

        String[] lines = out.toString().split("\\R"); // \\R gère \n, \r\n, etc.

        for (String line : lines) {
            int length = line.trim().length();
            if (length > width) {
                System.out.println("Line too long: [" + line + "] (" + length + " chars)");
            }
            assertTrue(length <= width, "Line too long: " + line);
        }

        // Vérifie qu'une partie du contenu attendu est bien là
        assertTrue(out.toString().contains("Lorem ipsum dolor sit amet"));
    }
    
    @Test
    void testAskYesOrNo_WithInvalidThenValidInput() {
        // Simule la saisie utilisateur : "X" (invalide), puis "Y"
        String simulatedInput = "X\nY\n";
        System.setIn(new ByteArrayInputStream(simulatedInput.getBytes()));

        // Capture la sortie console
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        System.setOut(new PrintStream(output));

        QuizRunner runner = new QuizRunner(null, new Scanner(System.in));

        // Appel de la méthode à tester
        String result = runner.askYesOrNo("Would you like to continue?");

        // Reset les flux
        System.setIn(System.in);
        System.setOut(System.out);

        // Vérifie le résultat
        assertEquals("Y", result);

        // Vérifie que le message d'erreur a bien été affiché
        String consoleOutput = output.toString();
        assertTrue(consoleOutput.contains("❌ Invalid input"));
        assertTrue(consoleOutput.contains("Would you like to continue?"));
    }
    
    @Test
    void testClearConsole_Prints50EmptyLines() {
        QuizRunner runner = new QuizRunner(null, new Scanner(System.in));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PrintStream originalOut = System.out;
        System.setOut(new PrintStream(out));

        runner.clearConsole();

        System.out.flush();
        System.setOut(originalOut);

        long newlines = out.toString().chars().filter(c -> c == '\n').count();
        assertEquals(50, newlines, "Expected 50 newline characters from clearConsole()");
    }
    
    @Test
    void testAskAndValidateAnswer_WithRetryThenSuccess() {
        // Préparation d'une question avec 2 réponses valides attendues
        Question question = new Question();
        question.setQuestion("Select two correct options.");
        question.setExpectedAnswers(2);

        Choice a = new Choice("A", "First correct", true, "");
        Choice b = new Choice("B", "Second correct", true, "");
        Choice c = new Choice("C", "Incorrect", false, "");

        question.setChoices(Arrays.asList(a, b, c));

        // Simule la saisie utilisateur : d'abord "A" (trop court), puis "A B" (bon)
        String simulatedInput = "A\nA B\n";
        Scanner testScanner = new Scanner(new ByteArrayInputStream(simulatedInput.getBytes()));

        // Capture System.out
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        System.setOut(new PrintStream(out));

        QuizRunner runner = new QuizRunner(null, testScanner);
        List<String> result = runner.askAndValidateAnswer(question, testScanner);

        // Reset la console
        System.setOut(System.out);

        // Vérification des résultats
        assertEquals(List.of("A", "B"), result);

        String consoleOutput = out.toString();
        assertTrue(consoleOutput.contains("❌ Please enter exactly 2 valid choice(s) from:"));
    }
    
    @Test
    void testAskToTryAnotherQuizzWhenPerfectScore_ReturnsTrue() throws Exception {
        // Simule l'entrée utilisateur : Y
        String input = "Y\n";
        Scanner testScanner = new Scanner(new ByteArrayInputStream(input.getBytes()));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        System.setOut(new PrintStream(out));

        QuizRunner runner = new QuizRunner(null, testScanner);
        boolean result = runner.askToTryAnotherQuizzWhenPerfectScore();

        System.setOut(System.out);
        System.setIn(System.in);

        assertTrue(result);
        assertTrue(out.toString().contains("Perfect score! Would you like to try another quiz?"));
    }

    @Test
    void testAskToTryAnotherQuizzWhenPerfectScore_ReturnsFalse() throws Exception {
        // Simule l'entrée utilisateur : N
        String input = "N\n";
        Scanner testScanner = new Scanner(new ByteArrayInputStream(input.getBytes()));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        System.setOut(new PrintStream(out));

        QuizRunner runner = new QuizRunner(null, testScanner); // ✅ CORRECTION ICI
        boolean result = runner.askToTryAnotherQuizzWhenPerfectScore();

        System.setOut(System.out);
        System.setIn(System.in);

        assertFalse(result);
    }
    
    @Test
    void testAskToReviewMistakes_WhenUserSaysYes_DisplaysMistakes() throws Exception {
        // Simuler l'entrée utilisateur : "Y"
        String input = "Y\n";
        Scanner scanner = new Scanner(new ByteArrayInputStream(input.getBytes()));

        // Préparer une question avec erreur
        Question question = new Question();
        question.setId(1);
        question.setQuestion("Which is a Scrum value?");
        question.setExpectedAnswers(1);

        Choice a = new Choice("A", "Courage", true, "It is correct.");
        Choice b = new Choice("B", "Wrong answer", false, "It is incorrect.");

        question.setChoices(List.of(a, b));

        QuizService service = new QuizService(List.of(question));
        service.submitAnswer(question, List.of("B")); // Erreur simulée

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        System.setOut(new PrintStream(out));

        QuizRunner runner = new QuizRunner(null, scanner);
        runner.askToReviewMistakes(service, List.of(question));

        System.setOut(System.out);

        String output = out.toString();
        assertTrue(output.contains("Review Mistakes"));
        assertTrue(output.contains("Q1"));
        assertTrue(output.contains("❌")); // symbole attendu
    }
    
    @Test
    void testAskToReviewMistakes_WhenUserSaysNo_DisplaysNothing() throws Exception {
        String input = "N\n";
        Scanner scanner = new Scanner(new ByteArrayInputStream(input.getBytes()));

        QuizService service = new QuizService(Collections.emptyList());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        System.setOut(new PrintStream(out));

        QuizRunner runner = new QuizRunner(null, scanner);
        runner.askToReviewMistakes(service, Collections.emptyList());

        System.setOut(System.out);

        String output = out.toString();
        assertFalse(output.contains("Review Mistakes"));
        assertFalse(output.contains("❌"));
    }
    
    @Test
    void testAskToTryAnotherQuizz_ReturnsTrue() throws Exception {
        String input = "Y\n";
        Scanner scanner = new Scanner(new ByteArrayInputStream(input.getBytes()));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        System.setOut(new PrintStream(out));

        QuizRunner runner = new QuizRunner(null, scanner);
        boolean result = runner.askToTryAnotherQuizz();

        System.setOut(System.out);

        assertTrue(result);
        assertTrue(out.toString().contains("Would you like to try another quiz?"));
    }
    
    @Test
    void testAskToTryAnotherQuizz_ReturnsFalse() throws Exception {
        String input = "N\n";
        Scanner scanner = new Scanner(new ByteArrayInputStream(input.getBytes()));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        System.setOut(new PrintStream(out));

        QuizRunner runner = new QuizRunner(null, scanner);
        boolean result = runner.askToTryAnotherQuizz();

        System.setOut(System.out);

        assertFalse(result);
    } 
    
}