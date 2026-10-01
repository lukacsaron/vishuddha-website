#!/bin/sh
# Starts as root only long enough to make sure the data volume belongs to the
# unprivileged user, then drops to it. A volume that Docker or Coolify created
# root-owned would otherwise make every save fail.
set -e

DATA_DIR="${DATA_DIR:-/data}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  if [ "$(stat -c %u "$DATA_DIR")" != "$(id -u node)" ]; then
    echo "[entrypoint] $DATA_DIR is not owned by node; fixing ownership"
    chown -R node:node "$DATA_DIR"
  fi
  exec su-exec node "$@"
fi

exec "$@"
