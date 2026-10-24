import { Inject, Injectable } from '@nestjs/common';
import type { Database } from 'better-sqlite3';
import { DATABASE } from '../database/database.module.js';
import { DEFAULT_PROFILE } from './default-profile.js';
import type { ProfileDto } from './dto/profile.dto.js';

const PROFILE_KEY = 'profile';

@Injectable()
export class ProfileService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  get(): ProfileDto {
    const row = this.db
      .prepare<[string], { value: string }>('SELECT value FROM settings WHERE key = ?')
      .get(PROFILE_KEY);
    return row ? (JSON.parse(row.value) as ProfileDto) : DEFAULT_PROFILE;
  }

  save(profile: ProfileDto): ProfileDto {
    const value: ProfileDto = {
      name: profile.name,
      role: profile.role,
      tagline: profile.tagline,
      about: profile.about,
      location: profile.location,
      email: profile.email,
      showreelUrl: profile.showreelUrl ?? null,
      socials: profile.socials.map(({ label, url }) => ({ label, url })),
    };
    this.db
      .prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      )
      .run(PROFILE_KEY, JSON.stringify(value));
    return value;
  }

  isSaved(): boolean {
    return (
      this.db.prepare('SELECT 1 FROM settings WHERE key = ?').get(PROFILE_KEY) !==
      undefined
    );
  }
}
