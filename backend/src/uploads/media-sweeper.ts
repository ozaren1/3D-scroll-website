import { lstat, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Database } from 'better-sqlite3';
import { DATABASE } from '../database/database.module.js';
import { TEMP_PREFIX } from './uploads.service.js';

// Only names the upload service generates; anything else in the folder is never touched.
const MEDIA_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp4|webm|jpg|png|webp)$/;
// How long a file must be both old and unreferenced before it goes: room to undo a replaced video,
// and time for a fresh upload to be saved into a work.
export const GRACE_MS = 24 * 60 * 60 * 1000;
const INTERVAL_MS = 60 * 60 * 1000;
// A pass that would delete more than this share of the media is treated as a sign of a wrong
// or empty database (bad DATABASE_PATH, restored old backup) and deletes nothing.
const MAX_SHARE = 0.25;
const SMALL_BATCH = 5;

// Deletes uploaded files nothing points to any more: replaced or removed videos, abandoned uploads.
@Injectable()
export class MediaSweeper implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(MediaSweeper.name);
  private timer: NodeJS.Timeout | null = null;
  // When each file was first seen unreferenced. In memory on purpose: a restart only delays deletion.
  private readonly orphanSince = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  onApplicationBootstrap() {
    const run = () => void this.sweep().catch((e: Error) => this.logger.error(`Sweep failed: ${e.message}`));
    run();
    this.timer = setInterval(run, INTERVAL_MS);
    this.timer.unref();
  }

  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
  }

  // Every place a media URL can be stored: works and any settings value (profile showreel, cards…).
  private references(): { text: string; projects: number } {
    const projects = this.db
      .prepare<[], { v: string | null; p: string | null }>('SELECT video_url AS v, poster_url AS p FROM projects')
      .all();
    const settings = this.db.prepare<[], { value: string }>('SELECT value FROM settings').all();
    const text = [...projects.flatMap((r) => [r.v ?? '', r.p ?? '']), ...settings.map((r) => r.value)].join('\n');
    return { text, projects: projects.length };
  }

  async sweep(now = Date.now()): Promise<string[]> {
    const dir = this.config.getOrThrow<string>('UPLOAD_DIR');
    const media: string[] = [];
    const staleTemp: string[] = [];
    for (const name of await readdir(dir)) {
      const temp = name.startsWith(TEMP_PREFIX);
      if (!temp && !MEDIA_NAME.test(name)) continue;
      const info = await lstat(join(dir, name)).catch(() => null);
      if (!info?.isFile()) continue;
      if (!temp) media.push(name);
      else if (now - info.mtimeMs >= GRACE_MS) staleTemp.push(name);
    }

    const doomed = [...staleTemp];
    const { text, projects } = this.references();
    const orphans = media.filter((name) => !text.includes(name));
    const orphanSet = new Set(orphans);
    // Deleting while iterating is safe for a Map.
    for (const name of this.orphanSince.keys()) {
      if (!orphanSet.has(name)) this.orphanSince.delete(name);
    }
    if (projects === 0) {
      // No works at all: more likely a wrong database than a deliberately empty site.
      if (orphans.length > 0) this.logger.warn('No works in the database: media files are left alone');
    } else {
      const ready: string[] = [];
      for (const name of orphans) {
        const since = this.orphanSince.get(name) ?? now;
        this.orphanSince.set(name, since);
        if (now - since >= GRACE_MS) ready.push(name);
      }
      if (ready.length > SMALL_BATCH && ready.length > media.length * MAX_SHARE) {
        this.logger.warn(
          `${ready.length} of ${media.length} media files look unused: too many, nothing deleted. Check DATABASE_PATH.`,
        );
      } else {
        doomed.push(...ready);
      }
    }

    const removed: string[] = [];
    for (const name of doomed) {
      await unlink(join(dir, name)).then(
        () => {
          removed.push(name);
          this.orphanSince.delete(name);
        },
        () => undefined,
      );
    }
    if (removed.length > 0) this.logger.log(`Removed ${removed.length} unused file(s): ${removed.join(', ')}`);
    return removed;
  }
}
