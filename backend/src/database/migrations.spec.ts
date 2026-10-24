import BetterSqlite3 from 'better-sqlite3';
import { runMigrations } from './migrations.js';

describe('migrations', () => {
  it('moves editing projects to corporate when upgrading from version 1', () => {
    const db = new BetterSqlite3(':memory:');
    db.exec(`CREATE TABLE projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, client TEXT,
      year INTEGER NOT NULL, category TEXT NOT NULL, orientation TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '',
      video_url TEXT NOT NULL, poster_url TEXT, sort_order INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT 'x', updated_at TEXT NOT NULL DEFAULT 'x');
      CREATE TABLE contact_requests (id INTEGER PRIMARY KEY, name TEXT, email TEXT, message TEXT, budget TEXT,
      status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL DEFAULT 'x');
      CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      INSERT INTO projects (slug, title, year, category, orientation, video_url)
      VALUES ('a', 'A', 2024, 'editing', 'horizontal', '/a.mp4'), ('b', 'B', 2024, 'motion', 'vertical', '/b.mp4');
      DELETE FROM projects WHERE slug = 'zzz';
      PRAGMA user_version = 1;`);
    db.exec("UPDATE sqlite_sequence SET seq = 9 WHERE name = 'projects'");

    runMigrations(db);

    const rows = db.prepare('SELECT slug, category FROM projects ORDER BY slug').all();
    expect(rows).toEqual([
      { slug: 'a', category: 'corporate' },
      { slug: 'b', category: 'motion' },
    ]);
    expect(() =>
      db
        .prepare("INSERT INTO projects (slug, title, year, category, orientation, video_url) VALUES ('c','C',2024,'editing','horizontal','/c.mp4')")
        .run(),
    ).toThrow();
    const { id } = db
      .prepare("INSERT INTO projects (slug, title, year, category, orientation, video_url) VALUES ('d','D',2024,'ads','horizontal','/d.mp4') RETURNING id")
      .get() as { id: number };
    expect(id).toBe(10);
    const columns = db.prepare("SELECT name FROM pragma_table_info('contact_requests')").all();
    expect(columns).toContainEqual({ name: 'consented_at' });
  });
});
