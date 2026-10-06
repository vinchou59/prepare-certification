#!/bin/bash
cd "$(dirname "$0")/target" || exit 1

JAVA_COMMAND=java
if [ -n "$JAVA_HOME" ]; then
  JAVA_COMMAND="$JAVA_HOME/bin/java"
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
  exit 1
fi

"$JAVA_COMMAND" -jar psm2-quiz-1.0-SNAPSHOT-jar-with-dependencies.jar