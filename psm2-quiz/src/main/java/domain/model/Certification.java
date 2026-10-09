package domain.model;

public enum Certification {
    PSM2("PSM II", "Professional Scrum Master II", "questions_psm2.json", 85),
    PSK("PSK I", "Professional Scrum with Kanban", "questions_psk.json", 85),
    CCAAGILE("CCA Agile", "Certified Agile Coach", "questions_cca_agile.json", null),
    PSPO1("PSPO I", "Professional Scrum Product Owner I", "questions_pspo1.json", 85),
    PSMAI("PSM-AI", "Professional Scrum Master with AI", "questions_psmai.json", null);

    private final String shortName;
    private final String fullName;
    private final String fileName;
    private final Integer passMark;

    Certification(String shortName, String fullName, String fileName, Integer passMark) {
        this.shortName = shortName;
        this.fullName = fullName;
        this.fileName = fileName;
        this.passMark = passMark;
    }

    public String getShortName() { return shortName; }
    public String getFullName() { return fullName; }
    public String getFileName() { return fileName; }
    /** Pass mark in percent, or null when unknown. */
    public Integer getPassMark() { return passMark; }
}
