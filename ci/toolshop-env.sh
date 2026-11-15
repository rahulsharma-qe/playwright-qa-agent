# Shared by start-toolshop.sh and stop-toolshop.sh: which Toolshop copy, where its compose file lives, and how to call compose.
SPRINT="${SPRINT:-sprint5}"
# Toolshop tag 2.5 (22-08-2026), the commit the pinned images were built from.
# Pinned together with ci/toolshop-images.<sprint>.yml: update both at once; ci/check-toolshop-pair.sh proves they match.
TOOLSHOP_COMMIT="9e7736c3841ec2bbb9a6822c9e6602353b7b9a65"
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
