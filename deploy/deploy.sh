#!/usr/bin/env bash
# Run on the Mac from the repo root: ships the committed HEAD to the server and rebuilds.
# Usage: deploy/deploy.sh [root@host]
set -euo pipefail
HOST=${1:-root@91.218.246.140}
SSH=(ssh -i ~/.ssh/zotov_vps "$HOST")

[ -z "$(git status --porcelain)" ] || echo "Внимание: незакоммиченные изменения не попадут на сервер"
echo "Выкладываю $(git rev-parse --short HEAD)…"
git archive --format=tar HEAD | "${SSH[@]}" 'rm -rf /opt/portfolio/app.new && mkdir -p /opt/portfolio/app.new && tar -x -C /opt/portfolio/app.new'
"${SSH[@]}" "set -e
  rm -rf /opt/portfolio/app.old
  [ -d /opt/portfolio/app ] && mv /opt/portfolio/app /opt/portfolio/app.old
  mv /opt/portfolio/app.new /opt/portfolio/app
  chmod +x /opt/portfolio/app/deploy/*.sh
  nohup /opt/portfolio/app/deploy/remote-update.sh > /opt/portfolio/deploy.log 2>&1 < /dev/null &"

echo "Сборка идёт на сервере, лог: /opt/portfolio/deploy.log"
until "${SSH[@]}" 'grep -qE "DEPLOY-DONE|^(ERROR|Error|.*failed to)" /opt/portfolio/deploy.log' < /dev/null 2>/dev/null; do sleep 15; done
"${SSH[@]}" 'tail -6 /opt/portfolio/deploy.log' < /dev/null
