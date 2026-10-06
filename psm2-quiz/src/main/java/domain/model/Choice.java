package domain.model;

public class Choice {
    private String label;
    private String text;
    private boolean isCorrect;
    private String explanation;

    public Choice() {}

    public Choice(String label, String text, boolean isCorrect, String explanation) {
        this.label = label;
        this.text = text;
        this.isCorrect = isCorrect;
        this.explanation = explanation;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public void setIsCorrect(boolean isCorrect) {
        this.isCorrect = isCorrect;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
}