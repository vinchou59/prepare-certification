package domain.model;

import java.util.List;

public class Question {
    private int id;
    private String question;
    private List<Choice> choices;
    private int expectedAnswers;

    public Question() {}

    public Question(int id, String question, List<Choice> choices) {
        this.id = id;
        this.question = question;
        this.choices = choices;
    }

    public int getId() {
        return id;
    }

    public String getQuestion() {
        return question;
    }

    public List<Choice> getChoices() {
        return choices;
    }

    public void setId(int id) {
        this.id = id;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public void setChoices(List<Choice> choices) {
        this.choices = choices;
    }
    
    public int getExpectedAnswers() {
        return expectedAnswers;
    }

    public void setExpectedAnswers(int expectedAnswers) {
        this.expectedAnswers = expectedAnswers;
    }

}