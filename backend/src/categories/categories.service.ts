import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Database } from 'better-sqlite3';
import { DATABASE } from '../database/database.module.js';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';

export interface Category {
  id: number;
  slug: string;
  label: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  visible: boolean;
  sortOrder: number;
  projectCount: number;
}

export type PublicCategory = Omit<Category, 'visible' | 'sortOrder' | 'projectCount'>;

interface CategoryRow {
  id: number;
  slug: string;
  label: string;
  title: string;
  seo_title: string;
  seo_description: string;
  visible: 0 | 1;
  sort_order: number;
  project_count: number;
}

const SELECT = `SELECT c.*, (SELECT COUNT(*) FROM projects p WHERE p.category = c.slug) AS project_count
  FROM categories c`;

const COLUMNS: Record<keyof CreateCategoryDto, string> = {
  slug: 'slug',
  label: 'label',
  title: 'title',
  seoTitle: 'seo_title',
  seoDescription: 'seo_description',
  visible: 'visible',
};

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    title: row.title,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    visible: row.visible === 1,
    sortOrder: row.sort_order,
    projectCount: row.project_count,
  };
}

export function toPublicCategory(c: Category): PublicCategory {
  const { visible: _v, sortOrder: _s, projectCount: _p, ...rest } = c;
  return rest;
}

function toParams(input: Partial<CreateCategoryDto>): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, column] of Object.entries(COLUMNS)) {
    const value = input[key as keyof CreateCategoryDto];
    if (value === undefined) continue;
    params[column] = typeof value === 'boolean' ? Number(value) : typeof value === 'string' ? value.trim() : value;
  }
  return params;
}

const isUnique = (error: unknown) =>
  (error as { code?: string } | null)?.code === 'SQLITE_CONSTRAINT_UNIQUE';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  list(options: { visibleOnly: boolean }): Category[] {
    const where = options.visibleOnly ? 'WHERE c.visible = 1' : '';
    return this.db
      .prepare<[], CategoryRow>(`${SELECT} ${where} ORDER BY c.sort_order, c.id`)
      .all()
      .map(toCategory);
  }

  findById(id: number): Category | undefined {
    const row = this.db.prepare<[number], CategoryRow>(`${SELECT} WHERE c.id = ?`).get(id);
    return row && toCategory(row);
  }

  create(dto: CreateCategoryDto): Category {
    const next = this.db
      .prepare<[], { next: number }>('SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM categories')
      .get()!.next;
    const params = { ...toParams(dto), sort_order: next };
    const columns = Object.keys(params);
    try {
      const { lastInsertRowid } = this.db
        .prepare(`INSERT INTO categories (${columns.join(', ')}) VALUES (${columns.map((c) => `@${c}`).join(', ')})`)
        .run(params);
      return this.findById(Number(lastInsertRowid))!;
    } catch (error) {
      if (isUnique(error)) throw new ConflictException('Slug is already taken');
      throw error;
    }
  }

  // A slug change cascades to the projects of the category (ON UPDATE CASCADE).
  update(id: number, dto: UpdateCategoryDto): Category {
    const params = toParams(dto);
    const columns = Object.keys(params);
    try {
      if (columns.length > 0) {
        this.db
          .prepare(`UPDATE categories SET ${columns.map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`)
          .run({ ...params, id });
      }
    } catch (error) {
      if (isUnique(error)) throw new ConflictException('Slug is already taken');
      throw error;
    }
    const category = this.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  remove(id: number): void {
    const category = this.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    if (category.projectCount > 0) {
      throw new ConflictException('The category still has works: move them or hide the category');
    }
    this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }

  reorder(ids: number[]): Category[] {
    const existing = new Set(this.list({ visibleOnly: false }).map((c) => c.id));
    const requested = new Set(ids);
    if (requested.size !== ids.length || requested.size !== existing.size || !ids.every((id) => existing.has(id))) {
      throw new BadRequestException('ids must list every existing category exactly once');
    }
    const stmt = this.db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
    this.db.transaction(() => ids.forEach((id, i) => stmt.run(i, id)))();
    return this.list({ visibleOnly: false });
  }
}
