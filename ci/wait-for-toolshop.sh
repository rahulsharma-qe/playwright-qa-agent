#!/usr/bin/env bash
# Waits until the local Toolshop API and site answer. Separate timeouts: the site runs `ng serve`, which compiles first.
set -euo pipefail

API_URL="${API_URL:-http://localhost:8091}"
BASE_URL="${BASE_URL:-http://localhost:4200}"
API_TIMEOUT_S="${API_TIMEOUT_S:-120}"
UI_TIMEOUT_S="${UI_TIMEOUT_S:-420}"

wait_for() {
  local what="$1" url="$2" timeout_s="$3" start
  start=$(date +%s)
  echo "== Waiting for the local Toolshop ${what} at ${url} (up to ${timeout_s}s)"
  until curl -fs -o /dev/null --max-time 10 "$url"; do
    if [ $(( $(date +%s) - start )) -ge "$timeout_s" ]; then
      echo "ERROR: Local Toolshop ${what} did not start at ${url} in ${timeout_s}s; see the docker compose logs." >&2
      exit 1
    fi
    sleep 5
  done
  echo "   ${what} ready after $(( $(date +%s) - start ))s"
}

wait_for "API" "${API_URL}/brands" "$API_TIMEOUT_S"   # a brands list also proves the seed worked
wait_for "site" "$BASE_URL" "$UI_TIMEOUT_S"
