#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_ANDROID_SDK_ROOT="$HOME/.codex-android/sdk"
DEFAULT_JDK_DIR="$(find "$HOME/.codex-android/jdks" -maxdepth 1 -type d -name 'jdk-*' | sort | tail -n 1)"

if [ -z "${JAVA_HOME:-}" ]; then
  if [ -z "$DEFAULT_JDK_DIR" ]; then
    echo "JAVA_HOME is not set and no local JDK was found in $HOME/.codex-android/jdks" >&2
    exit 1
  fi

  export JAVA_HOME="$DEFAULT_JDK_DIR/Contents/Home"
fi

export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$DEFAULT_ANDROID_SDK_ROOT}"
export PATH="$JAVA_HOME/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

if [ ! -x "$ROOT_DIR/android/gradlew" ]; then
  echo "Android project is missing. Run npm run android:add first." >&2
  exit 1
fi

if [ ! -d "$ANDROID_SDK_ROOT/platforms" ]; then
  echo "Android SDK was not found in $ANDROID_SDK_ROOT" >&2
  exit 1
fi

printf "sdk.dir=%s\n" "$ANDROID_SDK_ROOT" > "$ROOT_DIR/android/local.properties"

cd "$ROOT_DIR"
npm run android:sync

cd "$ROOT_DIR/android"
./gradlew assembleDebug
