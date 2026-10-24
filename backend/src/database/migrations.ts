import type { Database } from 'better-sqlite3';

const NOW = `(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

// Each entry upgrades the schema by one version. Never edit an applied entry; append a new one.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,
    title       TEXT    NOT NULL,
    client      TEXT,
    year        INTEGER NOT NULL,
    category    TEXT    NOT NULL CHECK (category IN ('editing', 'motion')),
    orientation TEXT    NOT NULL CHECK (orientation IN ('horizontal', 'vertical')),
    summary     TEXT    NOT NULL DEFAULT '',
    video_url   TEXT    NOT NULL,
    poster_url  TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    published   INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
    created_at  TEXT    NOT NULL DEFAULT ${NOW},
    updated_at  TEXT    NOT NULL DEFAULT ${NOW}
  );
  CREATE INDEX projects_public_idx ON projects (published, sort_order);

  CREATE TABLE contact_requests (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    message    TEXT NOT NULL,
    budget     TEXT,
    status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE INDEX contact_requests_status_idx ON contact_requests (status, created_at);

  CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
  // 2: finer categories (editing -> corporate) and proof of consent on contact requests.
  `
  CREATE TABLE projects_v2 (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL UNIQUE,
    title       TEXT    NOT NULL,
    client      TEXT,
    year        INTEGER NOT NULL,
    category    TEXT    NOT NULL CHECK (category IN ('reels', 'ads', 'motion', 'corporate', 'clips')),
    orientation TEXT    NOT NULL CHECK (orientation IN ('horizontal', 'vertical')),
    summary     TEXT    NOT NULL DEFAULT '',
    video_url   TEXT    NOT NULL,
    poster_url  TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    published   INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
    created_at  TEXT    NOT NULL DEFAULT ${NOW},
    updated_at  TEXT    NOT NULL DEFAULT ${NOW}
  );
  INSERT INTO projects_v2
    SELECT id, slug, title, client, year,
           CASE category WHEN 'editing' THEN 'corporate' ELSE category END,
           orientation, summary, video_url, poster_url, sort_order, published, created_at, updated_at
    FROM projects;
  -- Keep the AUTOINCREMENT counter so ids of deleted projects are never handed out again.
  UPDATE sqlite_sequence
    SET seq = MAX(seq, COALESCE((SELECT seq FROM sqlite_sequence WHERE name = 'projects'), 0))
    WHERE name = 'projects_v2';
  DROP TABLE projects;
  ALTER TABLE projects_v2 RENAME TO projects;
  CREATE INDEX projects_public_idx ON projects (published, sort_order);

  ALTER TABLE contact_requests ADD COLUMN consented_at TEXT;
  `,
];

export function runMigrations(db: Database): number {
  const current = db.pragma('user_version', { simple: true }) as number;
  for (let version = current; version < MIGRATIONS.length; version++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[version]);
      db.pragma(`user_version = ${version + 1}`);
    })();
  }
  return MIGRATIONS.length;
}
