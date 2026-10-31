#!/usr/bin/env bash
# Run on the Mac from the repo root: ships the committed HEAD to the server and rebuilds.
# Usage: deploy/deploy.sh [root@host]
set -euo pipefail
HOST=${1:-root@91.218.246.140}
SSH=(ssh -i ~/.ssh/zotov_vps "$HOST")

git diff --quiet HEAD || echo "Внимание: незакоммиченные изменения не попадут на сервер"
echo "Выкладываю $(git rev-parse --short HEAD)…"
git archive --format=tar HEAD | "${SSH[@]}" 'rm -rf /opt/portfolio/app.new && mkdir -p /opt/portfolio/app.new && tar -x -C /opt/portfolio/app.new'
"${SSH[@]}" "set -e
  rm -rf /opt/portfolio/app.old
  [ -d /opt/portfolio/app ] && mv /opt/portfolio/app /opt/portfolio/app.old
  mv /opt/portfolio/app.new /opt/portfolio/app
  cd /opt/portfolio/app/deploy
  docker compose --env-file /opt/portfolio/.env build
  docker compose --env-file /opt/portfolio/.env up -d --remove-orphans
  docker image prune -f >/dev/null
  docker compose ps"
