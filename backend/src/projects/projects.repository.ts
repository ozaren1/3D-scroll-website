import { Inject, Injectable } from '@nestjs/common';
import type { Database } from 'better-sqlite3';
import { DATABASE } from '../database/database.module.js';
import type { Project, ProjectInput } from './project.types.js';

interface ProjectRow {
  id: number;
  slug: string;
  title: string;
  client: string | null;
  year: number;
  category: string;
  orientation: Project['orientation'];
  summary: string;
  video_url: string;
  poster_url: string | null;
  sort_order: number;
  published: 0 | 1;
  created_at: string;
  updated_at: string;
}

const COLUMNS: Record<keyof ProjectInput, string> = {
  slug: 'slug',
  title: 'title',
  client: 'client',
  year: 'year',
  category: 'category',
  orientation: 'orientation',
  summary: 'summary',
  videoUrl: 'video_url',
  posterUrl: 'poster_url',
  sortOrder: 'sort_order',
  published: 'published',
};

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    client: row.client,
    year: row.year,
    category: row.category,
    orientation: row.orientation,
    summary: row.summary,
    videoUrl: row.video_url,
    posterUrl: row.poster_url,
    sortOrder: row.sort_order,
    published: row.published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toParams(input: Partial<ProjectInput>): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(COLUMNS)) {
    const value = input[key as keyof ProjectInput];
    if (value === undefined) continue;
    params[column] = typeof value === 'boolean' ? Number(value) : value;
  }
  return params;
}

@Injectable()
export class ProjectsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  findAll(options: { publishedOnly: boolean; category?: string }): Project[] {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    if (options.publishedOnly) where.push('published = 1');
    if (options.category) {
      where.push('category = @category');
      params.category = options.category;
    }
    const sql = `SELECT * FROM projects ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY sort_order, id`;
    return this.db.prepare<Record<string, unknown>, ProjectRow>(sql).all(params).map(toProject);
  }

  findById(id: number): Project | undefined {
    const row = this.db
      .prepare<[number], ProjectRow>('SELECT * FROM projects WHERE id = ?')
      .get(id);
    return row && toProject(row);
  }

  findBySlug(slug: string): Project | undefined {
    const row = this.db
      .prepare<[string], ProjectRow>('SELECT * FROM projects WHERE slug = ?')
      .get(slug);
    return row && toProject(row);
  }

  nextSortOrder(): number {
    const row = this.db
      .prepare<[], { next: number }>('SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM projects')
      .get();
    return row?.next ?? 0;
  }

  insert(input: ProjectInput & { sortOrder: number }): Project {
    const params = toParams(input);
    const columns = Object.keys(params);
    const { lastInsertRowid } = this.db
      .prepare(
        `INSERT INTO projects (${columns.join(', ')})
         VALUES (${columns.map((c) => `@${c}`).join(', ')})`,
      )
      .run(params);
    return this.findById(Number(lastInsertRowid))!;
  }

  update(id: number, input: Partial<ProjectInput>): Project | undefined {
    const params = toParams(input);
    const columns = Object.keys(params);
    if (columns.length > 0) {
      this.db
        .prepare(
          `UPDATE projects
           SET ${columns.map((c) => `${c} = @${c}`).join(', ')},
               updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
           WHERE id = @id`,
        )
        .run({ ...params, id });
    }
    return this.findById(id);
  }

  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM projects WHERE id = ?').run(id).changes > 0;
  }

  allIds(): number[] {
    return this.db
      .prepare<[], { id: number }>('SELECT id FROM projects')
      .all()
      .map((r) => r.id);
  }

  setOrder(ids: number[]): void {
    const stmt = this.db.prepare('UPDATE projects SET sort_order = ? WHERE id = ?');
    this.db.transaction(() => {
      ids.forEach((id, index) => stmt.run(index, id));
    })();
  }
}
