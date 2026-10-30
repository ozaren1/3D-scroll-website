import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateProjectDto } from './dto/project.dto.js';
import type { Project, ProjectInput } from './project.types.js';
import { ProjectsRepository } from './projects.repository.js';

const sqliteCode = (error: unknown) =>
  typeof error === 'object' && error !== null ? (error as { code?: string }).code : undefined;

// Maps constraint failures of a project write to API errors: a taken slug, or a category that does not exist.
function rethrow(error: unknown): never {
  if (sqliteCode(error) === 'SQLITE_CONSTRAINT_UNIQUE') throw new ConflictException('Slug is already taken');
  if (sqliteCode(error) === 'SQLITE_CONSTRAINT_FOREIGNKEY') throw new BadRequestException('Unknown category');
  throw error;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly repo: ProjectsRepository) {}

  listPublished(category?: string): Project[] {
    return this.repo.findAll({ publishedOnly: true, category });
  }

  listAll(): Project[] {
    return this.repo.findAll({ publishedOnly: false });
  }

  getPublishedBySlug(slug: string): Project {
    const project = this.repo.findBySlug(slug);
    if (!project || !project.published) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  create(input: CreateProjectDto): Project {
    try {
      return this.repo.insert({
        ...input,
        client: input.client ?? null,
        summary: input.summary ?? '',
        posterUrl: input.posterUrl ?? null,
        published: input.published ?? true,
        sortOrder: input.sortOrder ?? this.repo.nextSortOrder(),
      });
    } catch (error) {
      rethrow(error);
    }
  }

  update(id: number, input: Partial<ProjectInput>): Project {
    let project: Project | undefined;
    try {
      project = this.repo.update(id, input);
    } catch (error) {
      rethrow(error);
    }
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  remove(id: number): void {
    if (!this.repo.delete(id)) throw new NotFoundException('Project not found');
  }

  reorder(ids: number[]): Project[] {
    const existing = new Set(this.repo.allIds());
    const requested = new Set(ids);
    const sameSet =
      requested.size === ids.length &&
      requested.size === existing.size &&
      ids.every((id) => existing.has(id));
    if (!sameSet) {
      throw new BadRequestException(
        'ids must list every existing project exactly once',
      );
    }
    this.repo.setOrder(ids);
    return this.listAll();
  }
}
