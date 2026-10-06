package application;

import domain.model.Certification;
import domain.model.Choice;
import domain.model.Question;
import domain.service.QuizService;
import infrastructure.file.QuestionProvider;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.util.List;
import java.util.*;
import java.util.stream.Collectors;

public class QuizFrame extends JFrame {
    private static final long serialVersionUID = 1L;

	private final QuestionProvider provider;

    private JComboBox<String> certificationCombo;
    private JButton startButton;

    private JPanel questionPanel;
    private JLabel questionLabel;
    private JPanel choicesPanel;
    private JButton nextButton;
    private JButton backButton;

    private List<Question> currentQuestions = Collections.emptyList();
    private int currentIndex = -1;
    private QuizService quizService;

    private final List<AbstractButton> currentChoiceButtons = new ArrayList<>();
    private final Map<Question, List<String>> selectedByQuestion = new HashMap<>();

    public QuizFrame(QuestionProvider provider) {
        super("PSM2 / PSK / CCA Agile Quiz");
        this.provider = provider;
        applyGlobalFontScaling();
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(900, 600);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());

        add(buildTopPanel(), BorderLayout.NORTH);
        add(buildQuestionPanel(), BorderLayout.CENTER);

        setInitialState();
    }

    private JPanel buildTopPanel() {
        JPanel top = new JPanel(new FlowLayout(FlowLayout.LEFT));
        top.add(new JLabel("Certification:"));
        certificationCombo = new JComboBox<>(loadCertifications());
        top.add(certificationCombo);
        startButton = new JButton("Start Quiz");
        startButton.addActionListener(this::onStartQuiz);
        top.add(startButton);
        return top;
    }

    private JPanel buildQuestionPanel() {
        questionPanel = new JPanel();
        questionPanel.setLayout(new BorderLayout(10, 10));

        questionLabel = new JLabel(" ");
        questionLabel.setVerticalAlignment(SwingConstants.TOP);
        questionLabel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        questionPanel.add(new JScrollPane(questionLabel), BorderLayout.NORTH);

        choicesPanel = new JPanel();
        choicesPanel.setLayout(new BoxLayout(choicesPanel, BoxLayout.Y_AXIS));
        JScrollPane scroll = new JScrollPane(choicesPanel);
        questionPanel.add(scroll, BorderLayout.CENTER);

        backButton = new JButton("Back");
        backButton.addActionListener(this::onBack);
        nextButton = new JButton("Next");
        nextButton.addActionListener(this::onNext);
        JPanel bottom = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        bottom.add(backButton);
        bottom.add(nextButton);
        questionPanel.add(bottom, BorderLayout.SOUTH);

        return questionPanel;
    }

    private void setInitialState() {
        questionPanel.setVisible(false);
    }

    private String[] loadCertifications() {
        return Arrays.stream(Certification.values())
                     .map(Enum::name)
                     .toArray(String[]::new);
    }

    private void onStartQuiz(ActionEvent e) {
        String selectedCert = (String) certificationCombo.getSelectedItem();
        if (selectedCert == null) return;

        // Le provider est déjà configuré avec le bon fichier JSON
        List<Question> questions = provider.loadQuestions();

        int quizSize = Integer.getInteger("quiz.size", 5);
        Long seed = Long.getLong("quiz.seed");
        Random rng = (seed != null) ? new Random(seed) : new Random();

        quizService = new QuizService(questions, quizSize, rng);
        currentQuestions = quizService.getSelectedQuestions();
        currentIndex = 0;
        selectedByQuestion.clear();

        if (currentQuestions.isEmpty()) {
            JOptionPane.showMessageDialog(
                this,
                "No questions available for " + selectedCert,
                "No Data",
                JOptionPane.WARNING_MESSAGE
            );
            return;
        }

        renderCurrentQuestion();
        questionPanel.setVisible(true);
    }


    private void renderCurrentQuestion() {
        Question q = currentQuestions.get(currentIndex);
        questionLabel.setText("<html><b>Q" + (currentIndex + 1) + ":</b> " + escapeHtml(q.getQuestion()) + "</html>");

        choicesPanel.removeAll();
        currentChoiceButtons.clear();

        boolean singleChoice = q.getExpectedAnswers() == 1;
        ButtonGroup group = singleChoice ? new ButtonGroup() : null;

        for (Choice c : q.getChoices()) {
            AbstractButton btn = singleChoice ? new JRadioButton(c.getLabel() + ". " + c.getText())
                    : new JCheckBox(c.getLabel() + ". " + c.getText());
            btn.putClientProperty("label", c.getLabel());
            btn.setAlignmentX(Component.LEFT_ALIGNMENT);
            if (group != null && btn instanceof JRadioButton) {
                group.add((JRadioButton) btn);
            }
            choicesPanel.add(btn);
            choicesPanel.add(Box.createVerticalStrut(4));
            currentChoiceButtons.add(btn);
        }

        // Restore previous selections for this question (if any)
        List<String> previously = selectedByQuestion.get(q);
        if (previously != null) {
            for (AbstractButton b : currentChoiceButtons) {
                Object label = b.getClientProperty("label");
                if (label != null && previously.contains(label.toString())) {
                    b.setSelected(true);
                }
            }
        }

        choicesPanel.revalidate();
        choicesPanel.repaint();

        nextButton.setText(currentIndex == currentQuestions.size() - 1 ? "Finish" : "Next");
        backButton.setEnabled(currentIndex > 0);
    }

    private void onNext(ActionEvent e) {
        Question q = currentQuestions.get(currentIndex);
        List<String> selected = currentChoiceButtons.stream()
                .filter(AbstractButton::isSelected)
                .map(b -> Objects.toString(b.getClientProperty("label")))
                .collect(Collectors.toList());

        long validCount = selected.size();
        if (validCount != q.getExpectedAnswers()) {
            JOptionPane.showMessageDialog(this,
                    "Please select exactly " + q.getExpectedAnswers() + " choice(s).",
                    "Invalid selection",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }

        selectedByQuestion.put(q, selected);
        quizService.submitAnswer(q, selected);

        if (currentIndex < currentQuestions.size() - 1) {
            currentIndex++;
            renderCurrentQuestion();
        } else {
            onFinish();
        }
    }

    private void onBack(ActionEvent e) {
        if (currentIndex <= 0) return;
        // Save current selections before going back
        Question q = currentQuestions.get(currentIndex);
        List<String> selected = currentChoiceButtons.stream()
                .filter(AbstractButton::isSelected)
                .map(b -> Objects.toString(b.getClientProperty("label")))
                .collect(Collectors.toList());
        if (!selected.isEmpty()) {
            selectedByQuestion.put(q, selected);
            quizService.submitAnswer(q, selected);
        }
        currentIndex--;
        renderCurrentQuestion();
    }

    private void onFinish() {
        int score = quizService.calculateScore();
        int total = currentQuestions.size();
        int choice = JOptionPane.showOptionDialog(this,
                "Score: " + score + "/" + total + "\nReview mistakes?",
                "Quiz Completed",
                JOptionPane.YES_NO_OPTION,
                JOptionPane.INFORMATION_MESSAGE,
                null,
                new Object[]{"Yes", "No"},
                "Yes");

        if (choice == JOptionPane.YES_OPTION) {
            showMistakesDialog();
        }

        int again = JOptionPane.showConfirmDialog(this, "Try another quiz?", "Restart",
                JOptionPane.YES_NO_OPTION);
        if (again == JOptionPane.YES_OPTION) {
            currentQuestions = Collections.emptyList();
            currentIndex = -1;
            questionPanel.setVisible(false);
            selectedByQuestion.clear();
        } else {
            dispose();
        }
    }

    private void showMistakesDialog() {
        Map<Question, List<Choice>> mistakes = quizService.getMistakes();
        if (mistakes.isEmpty()) {
            JOptionPane.showMessageDialog(this, "No mistakes!", "Review", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        JTextArea area = new JTextArea();
        area.setEditable(false);
        StringBuilder sb = new StringBuilder();
        List<Question> ordered = currentQuestions;
        for (int i = 0; i < ordered.size(); i++) {
            Question q = ordered.get(i);
            if (!mistakes.containsKey(q)) continue;
            sb.append("Q").append(i + 1).append(": ").append(q.getQuestion()).append("\n");
            for (Choice c : mistakes.get(q)) {
                String symbol = c.isCorrect() ? "✅" : "❌";
                sb.append("  ").append(symbol).append(" ")
                        .append(c.getLabel()).append(": ")
                        .append(c.getText()).append("\n");
                if (c.getExplanation() != null && !c.getExplanation().isBlank()) {
                    sb.append("     ==> ").append(c.getExplanation()).append("\n");
                }
            }
            sb.append("\n");
        }
        area.setText(sb.toString());
        area.setCaretPosition(0);
        JScrollPane sp = new JScrollPane(area);
        sp.setPreferredSize(new Dimension(800, 400));
        JOptionPane.showMessageDialog(this, sp, "Review Mistakes", JOptionPane.PLAIN_MESSAGE);
    }

    private static String escapeHtml(String s) {
        return s == null ? "" : s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\n", "<br/>");
    }

    private static void applyGlobalFontScaling() {
        Integer size = Integer.getInteger("ui.font.size");
        if (size == null || size <= 0) return;
        Font base = new Font(Font.SANS_SERIF, Font.PLAIN, size);
        // Update common UI defaults
        UIManager.put("Label.font", base);
        UIManager.put("Button.font", base);
        UIManager.put("ComboBox.font", base);
        UIManager.put("RadioButton.font", base);
        UIManager.put("CheckBox.font", base);
        UIManager.put("TextArea.font", base);
        UIManager.put("TextField.font", base);
        UIManager.put("OptionPane.messageFont", base);
        UIManager.put("OptionPane.buttonFont", base);
    }
}


