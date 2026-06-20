#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
JAR="$SCRIPT_DIR/backend/build/libs/messenger-backend-0.0.1-SNAPSHOT.jar"
LOG="$SCRIPT_DIR/messenger.log"
PID_FILE="$SCRIPT_DIR/messenger.pid"

stop_existing() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      echo "기존 프로세스 종료 (PID: $PID)"
      kill "$PID"
      sleep 2
    fi
    rm -f "$PID_FILE"
  fi
}

stop_existing

echo "메신저 백엔드 시작..."
nohup java -jar "$JAR" > "$LOG" 2>&1 &
PID=$!
echo $PID > "$PID_FILE"
echo "시작됨 (PID: $PID)"
echo "로그: $LOG"
echo "포트: 8084"
