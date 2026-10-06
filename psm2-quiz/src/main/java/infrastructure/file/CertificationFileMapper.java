package infrastructure.file;

import domain.model.Certification;

public class CertificationFileMapper {

    public static String getFileName(Certification certification) {
        switch (certification) {
            case PSM2: return "questions_psm2.json";
            case PSK:  return "questions_psk.json";
            case CCAAGILE:  return "questions_cca_agile.json";
            case PSPO1:  return "questions_pspo1.json";
            case PSMAI:  return "questions_psmai.json";
            default:
                throw new IllegalArgumentException("Unknown certification: " + certification);
        }
    }
}
