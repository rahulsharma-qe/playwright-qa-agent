#!/usr/bin/env bash
# Stops the local Toolshop and removes its containers and data, including the API code volume (so a pin update
# never runs old code from it). Safe to run when nothing is running.
source "$(dirname "$0")/toolshop-env.sh"
if [ -f "${TOOLSHOP_DIR}/docker-compose.prod.yml" ] && [ -f "$IMAGES_FILE" ]; then
  compose down -v --remove-orphans
else
  docker compose -p "$COMPOSE_PROJECT" down -v --remove-orphans
fi
docker volume rm "$CODE_VOLUME" >/dev/null 2>&1 || true
if volumes=$(docker volume ls -q --filter "name=${COMPOSE_PROJECT}_" 2>/dev/null); then
  echo "== Toolshop stopped; volumes left: $(printf '%s' "$volumes" | grep -c .)"
else
  echo "== Toolshop stopped; volumes left: unknown (Docker not reachable)"
fi
exit 0
