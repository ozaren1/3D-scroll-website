import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Database } from 'better-sqlite3';
import { CategoriesService } from '../categories/categories.service.js';
import { DATABASE } from '../database/database.module.js';
import { DEFAULT_SERVICES, type LegacyService } from './default-services.js';
import type { ServiceDto } from './dto/service.dto.js';

const SERVICES_KEY = 'services';

// What the API returns: the stored card plus the slugs of its categories (null when gone).
export type ServiceView = ServiceDto & { category: string | null; fallback: string | null };

// The "Что я делаю" cards, stored as one JSON value in settings like the profile.
@Injectable()
export class ServicesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly categories: CategoriesService,
  ) {}

  private stored(): ServiceDto[] {
    const row = this.db
      .prepare<[string], { value: string }>('SELECT value FROM settings WHERE key = ?')
      .get(SERVICES_KEY);
    const raw = row ? (JSON.parse(row.value) as (ServiceDto | LegacyService)[]) : DEFAULT_SERVICES;
    const all = this.categories.list({ visibleOnly: false });
    const idBySlug = new Map(all.map((c) => [c.slug, c.id]));
    const known = new Set(all.map((c) => c.id));
    // A deleted category leaves a dangling id behind: treat it as "no category".
    const live = (id: number | null) => (id !== null && known.has(id) ? id : null);
    return raw.map((item) =>
      'categoryId' in item
        ? { ...item, categoryId: live(item.categoryId), fallbackId: live(item.fallbackId) }
        : {
            title: item.title,
            text: item.text,
            tags: item.tags,
            projectId: null,
            categoryId: idBySlug.get(item.category ?? '') ?? null,
            fallbackId: idBySlug.get(item.fallback ?? '') ?? null,
          },
    );
  }

  list(): ServiceView[] {
    const slugById = new Map(this.categories.list({ visibleOnly: false }).map((c) => [c.id, c.slug]));
    return this.stored().map((s) => ({
      ...s,
      category: s.categoryId ? (slugById.get(s.categoryId) ?? null) : null,
      fallback: s.fallbackId ? (slugById.get(s.fallbackId) ?? null) : null,
    }));
  }

  save(items: ServiceDto[]): ServiceView[] {
    const known = new Set(this.categories.list({ visibleOnly: false }).map((c) => c.id));
    const value: ServiceDto[] = items.map(({ title, text, tags, projectId, categoryId, fallbackId }) => {
      for (const id of [categoryId, fallbackId]) {
        if (id !== null && !known.has(id)) throw new BadRequestException(`Unknown category id ${id}`);
      }
      return {
        title: title.trim(),
        text,
        tags: tags.map((t) => t.trim()).filter(Boolean),
        projectId,
        categoryId,
        fallbackId,
      };
    });
    this.db
      .prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      )
      .run(SERVICES_KEY, JSON.stringify(value));
    return this.list();
  }
}
