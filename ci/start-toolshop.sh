#!/usr/bin/env bash
# Starts a private copy of Toolshop (Testsmith's practice shop, https://github.com/testsmith-io/practice-software-testing)
# from its published images, seeds it, and waits until the API and the site answer.
# CI runs the tests against this copy; anyone with Docker can start the same copy:
#   ci/start-toolshop.sh        then   BASE_URL=http://localhost:4200 API_URL=http://localhost:8091 npm test
#   ci/stop-toolshop.sh
set -euo pipefail
source "$(dirname "$0")/toolshop-env.sh"
SEED_TIMEOUT_S="${SEED_TIMEOUT_S:-300}"
SEED_LOG_DIR="${SEED_LOG_DIR:-$HOME/.cache/toolshop-seed-logs}"

fail() { echo "ERROR: $*" >&2; exit 1; }
started=$(date +%s)
elapsed() { echo $(( $(date +%s) - started )); }

[ -f "$IMAGES_FILE" ] || fail "No image pins for SPRINT=${SPRINT}: ${IMAGES_FILE} is missing. Run ci/pin-toolshop-images.sh."

echo "== Toolshop ${SPRINT}: source at ${TOOLSHOP_COMMIT:0:7} (compose file only; nothing is copied into this repo)"
if [ "$(git -C "$TOOLSHOP_DIR" rev-parse HEAD 2>/dev/null)" != "$TOOLSHOP_COMMIT" ]; then
  # TOOLSHOP_DIR can be changed, so only an empty folder or a folder this script cloned (it holds the marker
  # file .toolshop-source) is ever deleted.
  if [ -d "$TOOLSHOP_DIR" ] && [ -n "$(ls -A "$TOOLSHOP_DIR")" ] && [ ! -f "$TOOLSHOP_DIR/.toolshop-source" ]; then
    fail "TOOLSHOP_DIR (${TOOLSHOP_DIR}) is not a Toolshop clone; not deleting it."
  fi
  rm -rf "$TOOLSHOP_DIR" && mkdir -p "$TOOLSHOP_DIR"
  git -C "$TOOLSHOP_DIR" init -q
  git -C "$TOOLSHOP_DIR" fetch -q --depth 1 "$TOOLSHOP_REPO" "$TOOLSHOP_COMMIT"
  git -C "$TOOLSHOP_DIR" checkout -q FETCH_HEAD
  echo "Cloned by playwright-qa-agent ci/start-toolshop.sh; safe to delete." >"$TOOLSHOP_DIR/.toolshop-source"
fi

if [ "$SPRINT" = "sprint5" ]; then
  echo "== Checking that the pinned images were built from ${TOOLSHOP_COMMIT:0:7}"
  "${CI_DIR}/check-toolshop-pair.sh"
else
  echo "== ${SPRINT}: pair not checked (the check compares files at the normal copy's paths only)"
fi

# cron is left out on purpose: it re-seeds the database every hour, which would reset data in the middle of a run.
echo "== Starting mariadb, laravel-api, web and angular-ui from pinned images"
compose up -d --quiet-pull mariadb laravel-api web angular-ui
echo "   containers up after $(elapsed)s"

# depends_on only orders the start; it does not wait for the database or the API code to be ready.
# The seed is retried until it works: that is the readiness check for both.
echo "== Seeding the database (retried every 5 s, up to ${SEED_TIMEOUT_S}s)"
# One log per start, never overwritten, so a later question about a run (when did the seed finish, how many tries)
# can be answered from the log. Logging only: the retry and its timeout do not change.
mkdir -p "$SEED_LOG_DIR"
seed_log="${SEED_LOG_DIR}/seed-$(date -u +%Y%m%dT%H%M%SZ)-${SPRINT}.log"
utc_now() { date -u +"%d-%m-%Y %H:%M:%S UTC"; }
deadline=$(( $(date +%s) + SEED_TIMEOUT_S ))
attempts=0
while :; do
  attempts=$(( attempts + 1 ))
  echo "== attempt ${attempts} started $(utc_now)" >>"$seed_log"
  if compose exec -T laravel-api php artisan migrate:fresh --seed --force >>"$seed_log" 2>&1; then
    echo "== attempt ${attempts} finished $(utc_now)" >>"$seed_log"
    break
  fi
  echo "== attempt ${attempts} failed $(utc_now)" >>"$seed_log"
  if [ "$(date +%s)" -ge "$deadline" ]; then
    tail -20 "$seed_log" >&2
    fail "Local Toolshop database was not ready in $(( SEED_TIMEOUT_S / 60 )) minutes; see ${seed_log} and the docker compose logs."
  fi
  sleep 5
done
echo "   seeded after $(elapsed)s: ${attempts} attempt(s), finished $(utc_now); log ${seed_log}"

"${CI_DIR}/wait-for-toolshop.sh"
echo "== Toolshop ${SPRINT} ready after $(elapsed)s: site http://localhost:4200, API http://localhost:8091"
