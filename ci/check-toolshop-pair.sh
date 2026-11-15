#!/usr/bin/env bash
# Checks that the pinned images were built from the pinned commit (TOOLSHOP_COMMIT): the commit and the image digests
# are one pair, and a pin is only proven when a file inside each image is the same as that file at the commit.
#   UI image:  src/app/checkout/payment/payment.component.html  (the Payment step the checkout tests use)
#   API image: config/jwt.php                                    (the login lifetime the tests rely on)
# Only "match" or "mismatch" is printed, never a file's content, so the check is safe for every copy.
# Needs Docker and the Toolshop clone that start-toolshop.sh makes. Run by start-toolshop.sh; also on its own:
#   SPRINT=sprint5 ci/check-toolshop-pair.sh
set -euo pipefail
source "$(dirname "$0")/toolshop-env.sh"

fail() { echo "ERROR: $*" >&2; exit 1; }

[ -f "$IMAGES_FILE" ] || fail "No image pins for SPRINT=${SPRINT}: ${IMAGES_FILE} is missing."
[ "$(git -C "$TOOLSHOP_DIR" rev-parse HEAD 2>/dev/null)" = "$TOOLSHOP_COMMIT" ] ||
  fail "The Toolshop clone in ${TOOLSHOP_DIR} is not at ${TOOLSHOP_COMMIT:0:7}; run ci/start-toolshop.sh first."

image_of() {
  awk -v service="  $1:" '$0 == service { found = 1; next } found && $1 == "image:" { print $2; exit }' "$IMAGES_FILE"
}

# service | file inside the image | file in the clone
CHECKS=(
  "angular-ui|/app/src/app/checkout/payment/payment.component.html|${SPRINT}/UI/src/app/checkout/payment/payment.component.html"
  "laravel-api|/var/www/config/jwt.php|${SPRINT}/API/config/jwt.php"
)

mismatches=0
for entry in "${CHECKS[@]}"; do
  IFS='|' read -r service in_image in_clone <<<"$entry"
  image=$(image_of "$service")
  [ -n "$image" ] || fail "No image for ${service} in ${IMAGES_FILE}."
  [ -f "${TOOLSHOP_DIR}/${in_clone}" ] || fail "${in_clone} is not in the Toolshop clone at ${TOOLSHOP_COMMIT:0:7}."
  platform=$(awk -v service="  $service:" '$0 == service { found = 1; next } found && $1 == "platform:" { print $2; exit } found && $1 == "image:" { exit }' "$IMAGES_FILE")
  from_image=$(mktemp)
  if ! docker run --rm ${platform:+--platform "$platform"} --entrypoint cat "$image" "$in_image" >"$from_image" 2>/dev/null; then
    rm -f "$from_image"
    fail "Could not read ${in_image} from the ${service} image; the pair cannot be checked."
  fi
  if cmp -s "$from_image" "${TOOLSHOP_DIR}/${in_clone}"; then
    echo "   ${service}: match (${in_image##*/} at ${TOOLSHOP_COMMIT:0:7})"
  else
    echo "   ${service}: mismatch (${in_image##*/} at ${TOOLSHOP_COMMIT:0:7})"
    mismatches=$((mismatches + 1))
  fi
  rm -f "$from_image"
done

[ "$mismatches" -eq 0 ] || fail "The ${SPRINT} images were not built from Toolshop ${TOOLSHOP_COMMIT:0:7} (${mismatches} file(s) differ). Update TOOLSHOP_COMMIT and the pins together."
echo "   the ${SPRINT} images match Toolshop ${TOOLSHOP_COMMIT:0:7}"
