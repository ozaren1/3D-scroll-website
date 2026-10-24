import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import BetterSqlite3, { type Database } from 'better-sqlite3';
import { runMigrations } from './migrations.js';

export const DATABASE = Symbol('DATABASE');

export function openDatabase(path: string): Database {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new BetterSqlite3(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  runMigrations(db);
  return db;
}

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        openDatabase(config.getOrThrow<string>('DATABASE_PATH')),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  onApplicationShutdown() {
    if (this.db.open) this.db.close();
  }
}
