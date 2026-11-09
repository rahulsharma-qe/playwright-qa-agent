# Shared by start-toolshop.sh and stop-toolshop.sh: which Toolshop copy, where its compose file lives, and how to call compose.
SPRINT="${SPRINT:-sprint5}"
# Pinned together with ci/toolshop-images.<sprint>.yml: update both at once.
TOOLSHOP_COMMIT="ae7caecb811dd8952c09d997e69be7cb946ecd44"
TOOLSHOP_REPO="https://github.com/testsmith-io/practice-software-testing.git"
TOOLSHOP_DIR="${TOOLSHOP_DIR:-$HOME/.cache/toolshop-source}"
CI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGES_FILE="${CI_DIR}/toolshop-images.${SPRINT}.yml"
COMPOSE_PROJECT="toolshop"
CODE_VOLUME="${COMPOSE_PROJECT}_laravel-app-code"

compose() {
  # DISABLE_LOGGING is read by Toolshop's compose file; set it (empty, as in their default) to avoid a warning.
  SPRINT="$SPRINT" DISABLE_LOGGING="${DISABLE_LOGGING:-}" docker compose -p "$COMPOSE_PROJECT" \
    -f "${TOOLSHOP_DIR}/docker-compose.prod.yml" -f "$IMAGES_FILE" "$@"
}
