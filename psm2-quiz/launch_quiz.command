#!/bin/bash
# Lance le quiz : démarre un petit serveur local et ouvre l'interface dans le navigateur.
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR" || exit 1

JAVA_COMMAND=java
if [ -n "$JAVA_HOME" ]; then
  JAVA_COMMAND="$JAVA_HOME/bin/java"
elif [ -x /usr/libexec/java_home ]; then
  # macOS : cherche automatiquement un JDK 25 ou plus récent parmi ceux installés
  for v in 25 26 27 28 29 30; do
    FOUND_HOME=$(/usr/libexec/java_home -v "$v" 2>/dev/null) || continue
    if "$FOUND_HOME/bin/java" -version 2>&1 | grep -q "version \"$v"; then
      JAVA_COMMAND="$FOUND_HOME/bin/java"
      break
    fi
  done
fi

# Si le java retenu est trop ancien, cherche un JDK 25+ installé hors du dossier système
# (ex. ~/.jdk installé par l'outil de migration de VS Code, ~/Library/Java, SDKMAN).
java_major() { "$1" -version 2>&1 | sed -n '1s/.*version "\([0-9][0-9]*\).*/\1/p'; }
CURRENT_MAJOR=$(java_major "$JAVA_COMMAND" 2>/dev/null)
if [ -z "$CURRENT_MAJOR" ] || [ "$CURRENT_MAJOR" -lt 25 ]; then
  for candidate in \
      "$HOME"/.jdk/*/*/Contents/Home/bin/java \
      "$HOME"/.jdk/*/Contents/Home/bin/java \
      "$HOME"/.jdk/*/bin/java \
      "$HOME"/Library/Java/JavaVirtualMachines/*/Contents/Home/bin/java \
      "$HOME"/.sdkman/candidates/java/*/bin/java; do
    [ -x "$candidate" ] || continue
    MAJOR=$(java_major "$candidate")
    if [ -n "$MAJOR" ] && [ "$MAJOR" -ge 25 ]; then
      JAVA_COMMAND="$candidate"
      break
    fi
  done
fi

if ! command -v "$JAVA_COMMAND" >/dev/null 2>&1; then
  echo "Java 25 or later is required. Set JAVA_HOME or add a compatible JDK to PATH." >&2
  exit 1
fi

JAVA_VERSION=$("$JAVA_COMMAND" -version 2>&1 | sed -n '1s/.*version "\([0-9][0-9]*\).*/\1/p')
case "$JAVA_VERSION" in
  ''|*[!0-9]*)
    echo "Unable to determine the Java runtime version from $JAVA_COMMAND." >&2
    exit 1
    ;;
esac

if [ "$JAVA_VERSION" -lt 25 ]; then
  echo "Java 25 or later is required; $JAVA_COMMAND reports Java $JAVA_VERSION." >&2
  echo "JDK installés sur ce Mac :" >&2
  /usr/libexec/java_home -V 2>&1 | sed 's/^/  /' >&2
  echo "Installez un JDK 25 (par ex. : brew install --cask temurin@25) ou définissez JAVA_HOME." >&2
  exit 1
fi

JAR="target/psm2-quiz-1.0-SNAPSHOT-jar-with-dependencies.jar"

# Reconstruit le jar avec ce JDK s'il manque ou si le code a changé depuis.
if [ ! -f "$JAR" ] || [ -n "$(find src pom.xml -newer "$JAR" -type f 2>/dev/null | head -1)" ]; then
  if command -v mvn >/dev/null 2>&1; then
    echo "Construction de l'application (Java $JAVA_VERSION)..."
    JAVA_HOME="$(cd "$(dirname "$JAVA_COMMAND")/.." && pwd)" mvn -q clean package || {
      echo "La construction a échoué : voir les messages ci-dessus." >&2
      exit 1
    }
  elif [ ! -f "$JAR" ]; then
    echo "Le jar est introuvable et Maven n'est pas installé (brew install maven)." >&2
    exit 1
  else
    echo "Attention : le code a changé mais Maven est introuvable, lancement de l'ancien jar." >&2
  fi
fi

"$JAVA_COMMAND" -jar "$JAR"
