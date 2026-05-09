#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="${LOG_DIR:-$PROJECT_ROOT/logs}"
LOG_FILE="${LOG_FILE:-$LOG_DIR/poller-l2.log}"

mkdir -p "$LOG_DIR"
cd "$PROJECT_ROOT"
exec pnpm poller:start >> "$LOG_FILE" 2>&1
