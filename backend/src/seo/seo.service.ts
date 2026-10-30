import { Inject, Injectable } from '@nestjs/common';
import type { Database } from 'better-sqlite3';
import { DATABASE } from '../database/database.module.js';
import type { SeoDto } from './dto/seo.dto.js';

const SEO_KEY = 'seo';
const EMPTY = { title: '', description: '' };
export const DEFAULT_SEO: SeoDto = { home: EMPTY, works: EMPTY, about: EMPTY, privacy: EMPTY };

@Injectable()
export class SeoService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  get(): SeoDto {
    const row = this.db
      .prepare<[string], { value: string }>('SELECT value FROM settings WHERE key = ?')
      .get(SEO_KEY);
    return row ? { ...DEFAULT_SEO, ...(JSON.parse(row.value) as SeoDto) } : DEFAULT_SEO;
  }

  save(dto: SeoDto): SeoDto {
    const page = (p: { title: string; description: string }) => ({
      title: p.title.trim(),
      description: p.description.trim(),
    });
    const value: SeoDto = {
      home: page(dto.home),
      works: page(dto.works),
      about: page(dto.about),
      privacy: page(dto.privacy),
    };
    this.db
      .prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      )
      .run(SEO_KEY, JSON.stringify(value));
    return value;
  }
}
