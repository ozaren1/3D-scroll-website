#!/usr/bin/env bash
# Daily consistent copy of the SQLite database, 14 days kept. Run from cron (see deploy/README.md).
# The copies live on the same disk: they guard against mistakes, not against losing the server.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p /opt/portfolio/data/backups
docker compose --env-file /opt/portfolio/.env exec -T api node -e "
  const db = require('better-sqlite3')('/app/data/portfolio.db', { readonly: true });
  db.backup('/app/data/backups/portfolio-' + new Date().toISOString().slice(0, 10) + '.db').then(() => db.close());
"
find /opt/portfolio/data/backups -name 'portfolio-*.db' -mtime +14 -delete
