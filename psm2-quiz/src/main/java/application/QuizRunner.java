package application;

import domain.model.Certification;
import domain.model.Choice;
import domain.model.Question;
import domain.service.QuizService;
import infrastructure.file.CertificationFileMapper;
import infrastructure.file.JsonQuestionProvider;
import infrastructure.file.QuestionProvider;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

public class QuizRunner {

	private static final String QUIZ_COMPLETED = "✅✅✅ Quiz completed! ✅✅✅";
	private static final String PLEASE_ENTER_EXACTLY_D_VALID_CHOICE_S_FROM_S_N = "❌ Please enter exactly %d valid choice(s) from: %s%n";
	private static final String WOULD_YOU_LIKE_TO_TRY_ANOTHER_QUIZ_Y_N = "Would you like to try another quiz? (Y/N): ";
	private static final String WOULD_YOU_LIKE_TO_REVIEW_YOUR_MISTAKES_Y_N = "Would you like to review your mistakes? (Y/N): ";
	private static final String Y = "Y";
	private static final String PERFECT_SCORE_WOULD_YOU_LIKE_TO_TRY_ANOTHER_QUIZ_Y_N = "Perfect score! Would you like to try another quiz? (Y/N): ";
	private static final String INVALID_CHOICE_PLEASE_ENTER_A_NUMBER_BETWEEN_1_AND_5 = "❌ Invalid choice. Please enter a number between 1 and 5 : ";
	private static final String YOUR_CHOICE = "Your choice: ";
	private static final String _5_PSMAI = "5 - PSM with AI";
	private static final String _4_PSPO1 = "4 - PSPO1";
	private static final String _3_CCA_AGILE = "3 - CCA Agile";
	private static final String _2_PSK = "2 - PSK";
	private static final String _1_PSM2 = "1 - PSM2";
	private static final String WHICH_CERTIFICATION_DO_YOU_WANT_TO_TRAIN_FOR = "Which certification do you want to train for?";
	private static final String BOTTOM_TABLE = "----------------------";
	private static final String INPUT_PROMPT = "Your answer(s) : ";
	private static final int WRAP_WIDTH = 200;
	private final Scanner scanner;
	private final QuestionProvider provider;

	public QuizRunner(Scanner scanner) {
		this.scanner = scanner;
		Certification certification = askCertificationChoice();
		String jsonFile = CertificationFileMapper.getFileName(certification);
		this.provider = new JsonQuestionProvider(jsonFile);
	}

	QuizRunner(QuestionProvider provider, Scanner scanner) {
		this.scanner = scanner;
		this.provider = provider;
	}

	public void run() throws Exception {
		boolean retry;
		do {
			retry = executeQuizOnce();
		} while (retry);
	}

	private Certification askCertificationChoice() {
		System.out.println(WHICH_CERTIFICATION_DO_YOU_WANT_TO_TRAIN_FOR);
		System.out.println(_1_PSM2);
		System.out.println(_2_PSK);
		System.out.println(_3_CCA_AGILE);
		System.out.println(_4_PSPO1);
		System.out.println(_5_PSMAI);
		System.out.print(YOUR_CHOICE);
		System.out.flush();

		while (true) {
			String input = scanner.nextLine().trim();
			switch (input) {
			case "1":
				return Certification.PSM2;
			case "2":
				return Certification.PSK;
			case "3":
				return Certification.CCAAGILE;
			case "4":
				return Certification.PSPO1;
			case "5":
				return Certification.PSMAI;
			default:
				System.out.print(INVALID_CHOICE_PLEASE_ENTER_A_NUMBER_BETWEEN_1_AND_5);
			}
		}
	}

	boolean executeQuizOnce() throws Exception {

		List<Question> questions = provider.loadQuestions();

		int quizSize = Integer.getInteger("quiz.size", 5);
		Long seed = Long.getLong("quiz.seed");
		Random rng = (seed != null) ? new Random(seed) : new Random();

		QuizService service = new QuizService(questions, quizSize, rng);

		List<Question> selected = service.getSelectedQuestions();
		Instant start = Instant.now();

		for (int i = 0; i < selected.size(); i++) {
			clearConsole();
			Question q = selected.get(i);

			System.out.println("\nQ" + (i + 1) + ":");
			printWrapped(q.getQuestion(), WRAP_WIDTH);
			System.out.println();

			for (Choice c : q.getChoices()) {
				printWrapped(c.getLabel() + ". " + c.getText(), WRAP_WIDTH);
			}

			System.out.println();
			List<String> answers = askAndValidateAnswer(q, scanner);
			service.submitAnswer(q, answers);
		}

		Instant end = Instant.now();
		int score = service.calculateScore();
		printFinalScore(score, selected.size(), Duration.between(start, end));

		if (score == selected.size()) {
			return askToTryAnotherQuizzWhenPerfectScore();
		}

		askToReviewMistakes(service, selected);
		return askToTryAnotherQuizz();
	}

	boolean askToTryAnotherQuizzWhenPerfectScore() throws InterruptedException {
		System.out.println();
		System.out.flush();
		Thread.sleep(100);
		String choice = askYesOrNo(PERFECT_SCORE_WOULD_YOU_LIKE_TO_TRY_ANOTHER_QUIZ_Y_N);
		return choice.equalsIgnoreCase(Y);
	}

	void askToReviewMistakes(QuizService service, List<Question> selected) throws InterruptedException {
		System.out.println();
		System.out.flush();
		Thread.sleep(100);
		String reviewChoice = askYesOrNo(WOULD_YOU_LIKE_TO_REVIEW_YOUR_MISTAKES_Y_N);
		if (reviewChoice.equalsIgnoreCase(Y)) {
			printMistakes(service.getMistakes(), selected);
			System.out.println();
			System.out.println();
		}
	}

	boolean askToTryAnotherQuizz() throws InterruptedException {
		System.out.println();
		System.out.flush();
		Thread.sleep(100);
		String replayChoice = askYesOrNo(WOULD_YOU_LIKE_TO_TRY_ANOTHER_QUIZ_Y_N);
		return replayChoice.equalsIgnoreCase(Y);
	}

	List<String> askAndValidateAnswer(Question question, Scanner scanner) {
		Set<String> validLabels = question.getChoices().stream().map(Choice::getLabel).collect(Collectors.toSet());

		List<String> answers;

		do {
			System.out.print(INPUT_PROMPT);
			String input = scanner.nextLine().trim();
			answers = parseUserInput(input);

			long validCount = answers.stream().filter(validLabels::contains).count();

			if (validCount != question.getExpectedAnswers()) {
				System.out.printf(PLEASE_ENTER_EXACTLY_D_VALID_CHOICE_S_FROM_S_N, question.getExpectedAnswers(),
						validLabels);
			} else {
				return answers.stream().filter(validLabels::contains).distinct().collect(Collectors.toList());
			}

		} while (true);
	}

	List<String> parseUserInput(String input) {
		return input.toUpperCase().replaceAll("[^A-Z]", "").chars().mapToObj(c -> String.valueOf((char) c)).distinct()
				.collect(Collectors.toList());
	}

	void printFinalScore(int score, int total, Duration duration) {
		System.out.println();
		System.out.println("=".repeat(WRAP_WIDTH));
		System.out.println(QUIZ_COMPLETED);
		System.out.println();
		System.out.println("|     Score: " + score + "/" + total + "     |");
		System.out.println(BOTTOM_TABLE);

		long minutes = duration.toMinutes();
		long seconds = duration.getSeconds() % 60;
		System.out.printf("🕒 Time : %d min %02d sec  🕒\n", minutes, seconds);
		System.out.println();
	}

	void printMistakes(Map<Question, List<Choice>> mistakes, List<Question> selected) {
		System.out.println("\n--- Review Mistakes ---");
		for (int i = 0; i < selected.size(); i++) {
			Question q = selected.get(i);
			if (mistakes.containsKey(q)) {
				System.out.println("\nQ" + (i + 1) + ":");
				printWrapped(q.getQuestion(), WRAP_WIDTH);
				for (Choice c : mistakes.get(q)) {
					String symbol = c.isCorrect() ? "✅" : "❌";
					printWrapped(symbol + " " + c.getLabel() + ": " + c.getText(), WRAP_WIDTH);
					printWrapped(" ==> " + c.getExplanation(), WRAP_WIDTH);
				}
			}
		}
	}

	void printWrapped(String text, int width) {
		String[] lines = text.split("\n");
		for (String line : lines) {
			String[] words = line.trim().split("\\s+");
			StringBuilder currentLine = new StringBuilder();
			for (String word : words) {
				if (currentLine.length() + word.length() + 1 > width) {
					System.out.println(currentLine.toString());
					currentLine = new StringBuilder();
				}
				if (currentLine.length() > 0) {
					currentLine.append(" ");
				}
				currentLine.append(word);
			}
			if (currentLine.length() > 0) {
				System.out.println(currentLine.toString());
			}
		}
	}

	String askYesOrNo(String prompt) {
		while (true) {
			System.out.print(prompt + " ");
			System.out.flush();
			String input = scanner.nextLine().trim().toUpperCase();
			System.out.println();
			if (input.equals(Y) || input.equals("N")) {
				return input;
			}
			System.out.println("❌ Invalid input. Please enter Y or N.");
		}
	}

	void clearConsole() {
		for (int i = 0; i < 50; ++i)
			System.out.println();
	}
}
