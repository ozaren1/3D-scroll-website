import { mkdtempSync, readdirSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ConfigService } from '@nestjs/config';
import type { Database } from 'better-sqlite3';
import { openDatabase } from '../database/database.module.js';
import { GRACE_MS, MediaSweeper } from './media-sweeper.js';

const name = (n: number, ext = 'mp4') => `${String(n).padStart(8, '0')}-aaaa-4bbb-8ccc-dddddddddddd.${ext}`;
const HOUR = 60 * 60 * 1000;

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'sweeper-'));
  const db = openDatabase(':memory:');
  const config = { getOrThrow: () => dir } as unknown as ConfigService;
  const touch = (...files: string[]) => files.forEach((f) => writeFileSync(join(dir, f), 'x'));
  const age = (f: string, ms: number) => {
    const t = (Date.now() - ms) / 1000;
    utimesSync(join(dir, f), t, t);
  };
  return { dir, db, sweeper: new MediaSweeper(config, db), touch, age };
}

const addWork = (db: Database, slug: string, video: string, poster: string | null = null) =>
  db
    .prepare(
      `INSERT INTO projects (slug, title, year, category, orientation, video_url, poster_url)
       VALUES (?, 'W', 2026, 'motion', 'horizontal', ?, ?)`,
    )
    .run(slug, `/media/${video}`, poster && `/media/${poster}`);

describe('MediaSweeper', () => {
  it('deletes a file only after it has been unreferenced for a day', async () => {
    const { dir, db, sweeper, touch, age } = setup();
    const f = {
      inWork: name(1),
      poster: name(2, 'jpg'),
      showreel: name(3),
      unused: name(4),
      foreign: 'notes.mp4',
      temp: '.upload-old',
      freshTemp: '.upload-new',
    };
    touch(...Object.values(f));
    for (let i = 5; i < 12; i++) touch(name(i)); // keeps the unused share small
    for (let i = 5; i < 12; i++) addWork(db, `k${i}`, name(i));
    age(f.temp, GRACE_MS + HOUR);
    age(f.unused, 30 * GRACE_MS); // an old file is not enough on its own
    addWork(db, 'w', f.inWork, f.poster);
    db.prepare("INSERT INTO settings (key, value) VALUES ('profile', ?)").run(
      JSON.stringify({ showreelUrl: `/media/${f.showreel}` }),
    );

    const now = Date.now();
    expect(await sweeper.sweep(now)).toEqual([f.temp]);
    expect(await sweeper.sweep(now + GRACE_MS - HOUR)).toEqual([]);
    // A day later the fresh temp file is stale too.
    expect((await sweeper.sweep(now + GRACE_MS + HOUR)).sort()).toEqual([f.freshTemp, f.unused].sort());
    expect(readdirSync(dir)).toEqual(expect.arrayContaining([f.inWork, f.poster, f.showreel, f.foreign]));
    db.close();
  });

  it('forgets a file that is referenced again', async () => {
    const { db, sweeper, touch } = setup();
    touch(name(1), name(2));
    addWork(db, 'a', name(1));
    const now = Date.now();
    await sweeper.sweep(now);
    addWork(db, 'b', name(2));
    await sweeper.sweep(now + HOUR);
    db.prepare("DELETE FROM projects WHERE slug = 'b'").run();
    expect(await sweeper.sweep(now + GRACE_MS + HOUR)).toEqual([]);
    db.close();
  });

  it('leaves media alone when the database has no works', async () => {
    const { dir, db, sweeper, touch } = setup();
    touch(name(1), name(2));
    const now = Date.now();
    await sweeper.sweep(now);
    expect(await sweeper.sweep(now + 2 * GRACE_MS)).toEqual([]);
    expect(readdirSync(dir)).toHaveLength(2);
    db.close();
  });

  it('deletes nothing when most of the media looks unused', async () => {
    const { dir, db, sweeper, touch } = setup();
    for (let i = 1; i <= 10; i++) touch(name(i));
    addWork(db, 'a', name(1));
    const now = Date.now();
    await sweeper.sweep(now);
    expect(await sweeper.sweep(now + GRACE_MS)).toEqual([]);
    expect(readdirSync(dir)).toHaveLength(10);
    db.close();
  });
});
