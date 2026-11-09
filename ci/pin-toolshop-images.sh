#!/usr/bin/env bash
# Writes ci/toolshop-images.<sprint>.yml: the Toolshop images CI starts, each pinned to its sha256 digest.
# If an image is not published for amd64 (what CI runners are), a `platform:` line is written so the runner uses
# emulation (QEMU) for it. Needs curl and Node; no Docker.
# Run it when updating the pins, together with TOOLSHOP_COMMIT in ci/toolshop-env.sh:
#   SPRINT=sprint5 ci/pin-toolshop-images.sh
set -euo pipefail
shopt -s inherit_errexit 2>/dev/null || true  # bash 4.4+; the digest check below also catches failures (macOS ships bash 3.2)

SPRINT="${SPRINT:-sprint5}"
OUT="$(cd "$(dirname "$0")" && pwd)/toolshop-images.${SPRINT}.yml"
ACCEPT="application/vnd.oci.image.index.v1+json,application/vnd.docker.distribution.manifest.list.v2+json,application/vnd.docker.distribution.manifest.v2+json,application/vnd.oci.image.manifest.v1+json"
REGISTRY="https://registry-1.docker.io/v2"

# service name | image | tag
IMAGES=(
  "laravel-api|testsmith/practice-software-testing-${SPRINT}-api|latest"
  "angular-ui|testsmith/practice-software-testing-${SPRINT}-ui|latest"
  "web|testsmith/practice-software-testing-web|latest"
  "mariadb|yobasystems/alpine-mariadb|10.6.11"
)

token_for() {
  curl -fsS "https://auth.docker.io/token?service=registry.docker.io&scope=repository:$1:pull" |
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).token))'
}

# Prints "<digest> <platforms>", platforms as os/arch joined by commas.
pin() {
  local image="$1" tag="$2" token headers manifest digest
  token=$(token_for "$image")
  headers=$(mktemp)
  manifest=$(curl -fsS -D "$headers" -H "Authorization: Bearer ${token}" -H "Accept: ${ACCEPT}" \
    "${REGISTRY}/${image}/manifests/${tag}")
  digest=$(tr -d '\r' <"$headers" | awk -F': ' 'tolower($1) == "docker-content-digest" { print $2 }')
  rm -f "$headers"
  [ -n "$digest" ] || { echo "Could not read the digest of ${image}:${tag}" >&2; exit 1; }
  echo "$digest $(platforms_of "$image" "$token" "$manifest")"
}

# An index lists its platforms; a single image says its platform in its config blob.
platforms_of() {
  local image="$1" token="$2" manifest="$3" config
  config=$(MANIFEST="$manifest" node -e '
    const m = JSON.parse(process.env.MANIFEST);
    if (m.manifests) {
      const p = m.manifests.map(x => x.platform).filter(p => p && p.os !== "unknown")
        .map(p => `${p.os}/${p.architecture}${p.variant ? "/" + p.variant : ""}`);
      console.log("PLATFORMS " + [...new Set(p)].join(","));
    } else console.log("CONFIG " + m.config.digest);')
  if [[ "$config" == PLATFORMS* ]]; then echo "${config#PLATFORMS }"; return; fi
  curl -fsSL -H "Authorization: Bearer ${token}" "${REGISTRY}/${image}/blobs/${config#CONFIG }" |
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const c=JSON.parse(s);console.log(`${c.os}/${c.architecture}${c.variant ? "/" + c.variant : ""}`)})'
}

# Written to a temporary file first; the pins file is replaced only when every image is pinned.
TMP_OUT="$(mktemp)"
trap 'rm -f "$TMP_OUT"' EXIT
{
  echo "# Toolshop ${SPRINT} images for CI, pinned by digest. Written by ci/pin-toolshop-images.sh on $(date +%d-%m-%Y)."
  echo "# The clone commit (TOOLSHOP_COMMIT in ci/toolshop-env.sh) and these digests are one pair: update them together."
  echo "services:"
  for entry in "${IMAGES[@]}"; do
    IFS='|' read -r service image tag <<<"$entry"
    result=$(pin "$image" "$tag") || { echo "ERROR: could not pin ${image}:${tag}; ${OUT} is unchanged." >&2; exit 1; }
    read -r digest platforms <<<"$result"
    if [[ "$digest" != sha256:* || -z "$platforms" ]]; then
      echo "ERROR: no digest or platform for ${image}:${tag}; ${OUT} is unchanged." >&2
      exit 1
    fi
    echo "  ${service}:"
    if [[ ",${platforms}," != *",linux/amd64,"* ]]; then
      # Prefer linux/arm64 for emulation; otherwise the first platform, with its variant (for example linux/arm/v7).
      platform="${platforms%%,*}"
      [[ ",${platforms}," == *",linux/arm64,"* ]] && platform="linux/arm64"
      echo "    platform: ${platform}  # not published for amd64 (${platforms}); CI runs it under emulation (QEMU)"
    fi
    echo "    image: ${image}@${digest}  # ${tag}"
  done
} >"$TMP_OUT"
mv "$TMP_OUT" "$OUT"
trap - EXIT
echo "Written: $OUT"
cat "$OUT"
