#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <markdown-file> [wechat-api args...]" >&2
  exit 1
fi

FILE="$1"
shift || true

if [ ! -f "$FILE" ]; then
  echo "Markdown file not found: $FILE" >&2
  exit 1
fi

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ".env"
  set +a
fi

: "${WECHAT_APP_ID:?WECHAT_APP_ID is required}"
: "${WECHAT_APP_SECRET:?WECHAT_APP_SECRET is required}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if command -v bun >/dev/null 2>&1; then
  exec bun "$SCRIPT_DIR/wechat-api.ts" "$FILE" --theme default "$@"
else
  export npm_config_cache="${TMPDIR:-/tmp}/codex-npm-cache"
  exec npx -y bun "$SCRIPT_DIR/wechat-api.ts" "$FILE" --theme default "$@"
fi
