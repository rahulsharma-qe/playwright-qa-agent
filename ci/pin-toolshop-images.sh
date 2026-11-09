#!/usr/bin/env bash
# Writes ci/toolshop-images.<sprint>.yml: the Toolshop images CI starts, each pinned to its sha256 digest.
# Needs only curl (no Docker). Run it when updating the pins, together with TOOLSHOP_COMMIT in start-toolshop.sh.
#   SPRINT=sprint5 ci/pin-toolshop-images.sh
set -euo pipefail

SPRINT="${SPRINT:-sprint5}"
OUT="$(cd "$(dirname "$0")" && pwd)/toolshop-images.${SPRINT}.yml"
ACCEPT="application/vnd.oci.image.index.v1+json,application/vnd.docker.distribution.manifest.list.v2+json,application/vnd.docker.distribution.manifest.v2+json,application/vnd.oci.image.manifest.v1+json"

# service name | image | tag
IMAGES=(
  "laravel-api|testsmith/practice-software-testing-${SPRINT}-api|latest"
  "angular-ui|testsmith/practice-software-testing-${SPRINT}-ui|latest"
  "web|testsmith/practice-software-testing-web|latest"
  "mariadb|yobasystems/alpine-mariadb|10.6.11"
)

digest_of() {
  local image="$1" tag="$2" token digest
  token=$(curl -fsS "https://auth.docker.io/token?service=registry.docker.io&scope=repository:${image}:pull" |
    sed -E 's/.*"token":"([^"]+)".*/\1/')
  digest=$(curl -fsSI -H "Authorization: Bearer ${token}" -H "Accept: ${ACCEPT}" \
    "https://registry-1.docker.io/v2/${image}/manifests/${tag}" | tr -d '\r' |
    awk -F': ' 'tolower($1) == "docker-content-digest" { print $2 }')
  [ -n "$digest" ] || { echo "Could not read the digest of ${image}:${tag}" >&2; exit 1; }
  echo "$digest"
}

{
  echo "# Toolshop ${SPRINT} images for CI, pinned by digest. Written by ci/pin-toolshop-images.sh on $(date +%d-%m-%Y)."
  echo "# The clone commit (TOOLSHOP_COMMIT in ci/start-toolshop.sh) and these digests are one pair: update them together."
  echo "services:"
  for entry in "${IMAGES[@]}"; do
    IFS='|' read -r service image tag <<<"$entry"
    echo "  ${service}:"
    echo "    image: ${image}@$(digest_of "$image" "$tag")  # ${tag}"
  done
} >"$OUT"
echo "Written: $OUT"
cat "$OUT"
