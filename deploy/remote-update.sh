#!/usr/bin/env bash
# Runs on the server, detached from SSH, so a dropped connection cannot kill the build.
# Started by deploy/deploy.sh; its progress goes to /opt/portfolio/deploy.log.
set -euo pipefail
cd "$(dirname "$0")"
E=/opt/portfolio/.env

docker compose --env-file "$E" build
# Always new containers: nothing written inside the old ones survives a deploy.
docker compose --env-file "$E" up -d --force-recreate --remove-orphans
docker compose --env-file "$E" exec -T web node -e "
  (async () => { for (let i = 0; i < 30; i++) { try { const r = await fetch('http://localhost:3000/'); if (r.ok) return; } catch {} await new Promise(r => setTimeout(r, 1000)); } process.exit(1); })()
"
docker image prune -f > /dev/null
docker compose --env-file "$E" ps --format '{{.Name}} {{.Status}}'
echo DEPLOY-DONE
