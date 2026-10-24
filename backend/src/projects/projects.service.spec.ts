import { BadRequestException, ConflictException } from '@nestjs/common';
import { openDatabase } from '../database/database.module.js';
import { ProjectsRepository } from './projects.repository.js';
import { ProjectsService } from './projects.service.js';

const input = (slug: string) => ({
  slug,
  title: slug,
  year: 2025,
  category: 'ads' as const,
  orientation: 'horizontal' as const,
  videoUrl: `/media/${slug}.mp4`,
});

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(() => {
    service = new ProjectsService(new ProjectsRepository(openDatabase(':memory:')));
  });

  it('appends new projects to the end and fills defaults', () => {
    const a = service.create(input('a'));
    const b = service.create(input('b'));
    expect([a.sortOrder, b.sortOrder]).toEqual([0, 1]);
    expect(a).toMatchObject({ client: null, summary: '', posterUrl: null, published: true });
  });

  it('maps a duplicate slug to 409', () => {
    service.create(input('a'));
    expect(() => service.create(input('a'))).toThrow(ConflictException);
  });

  describe('reorder', () => {
    let ids: number[];

    beforeEach(() => {
      ids = ['a', 'b', 'c'].map((s) => service.create(input(s)).id);
    });

    it('applies a full permutation', () => {
      const order = [ids[2], ids[0], ids[1]];
      expect(service.reorder(order).map((p) => p.id)).toEqual(order);
    });

    it.each([
      ['a missing id', () => [ids[0], ids[1]]],
      ['a duplicate', () => [ids[0], ids[0], ids[1]]],
      ['an unknown id', () => [ids[0], ids[1], 999]],
    ])('rejects %s', (_name, make) => {
      expect(() => service.reorder(make())).toThrow(BadRequestException);
    });
  });
});
