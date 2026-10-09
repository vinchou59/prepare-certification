package infrastructure.file;

import domain.model.Certification;

public class CertificationFileMapper {

    public static String getFileName(Certification certification) {
        if (certification == null) {
            throw new IllegalArgumentException("Unknown certification: null");
        }
        return certification.getFileName();
    }
}
