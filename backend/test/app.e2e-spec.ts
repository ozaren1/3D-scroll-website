import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
type App = Parameters<typeof request>[0];
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './constants.js';

const project = (overrides: Record<string, unknown> = {}) => ({
  slug: 'night-drive',
  title: 'Night drive',
  client: 'Trassa',
  year: 2025,
  category: 'ads',
  orientation: 'horizontal',
  summary: 'A 30 second spot.',
  videoUrl: '/assets/video/3.mp4',
  ...overrides,
});

const MP4_HEAD = Buffer.from([0, 0, 0, 0x18, ...Buffer.from('ftypmp42'), 0, 0, 0, 0]);
const PNG_HEAD = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

describe('Portfolio API (e2e)', () => {
  let app: NestExpressApplication;
  let http: App;
  let token: string;

  const admin = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    http = app.getHttpServer();

    const res = await request(http)
      .post('/api/auth/login')
      .send({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD })
      .expect(200);
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('health and profile', () => {
    it('GET /api/health', async () => {
      await request(http).get('/api/health').expect(200, { status: 'ok' });
    });

    it('serves the default profile, then the saved one', async () => {
      const before = await request(http).get('/api/profile').expect(200);
      expect(before.body.name).toBeTruthy();

      expect(before.body.availability).toEqual(expect.any(String));
      const profile = {
        ...before.body,
        name: 'Test Person',
        availability: 'Свободен с декабря',
        socials: [{ label: 'Telegram', url: 'https://t.me/test' }],
      };
      await request(http).put('/api/admin/profile').send(profile).expect(401);
      await request(http).put('/api/admin/profile').set(admin()).send(profile).expect(200);

      const after = await request(http).get('/api/profile').expect(200);
      expect(after.body).toEqual(profile);
    });

    it('rejects unsafe social links', async () => {
      const { body } = await request(http).get('/api/profile');
      await request(http)
        .put('/api/admin/profile')
        .set(admin())
        .send({ ...body, socials: [{ label: 'x', url: 'javascript:alert(1)' }] })
        .expect(400);
    });
  });

  describe('auth', () => {
    it('rejects a wrong password and an unknown e-mail with the same response', async () => {
      const wrongPassword = await request(http)
        .post('/api/auth/login')
        .send({ email: TEST_ADMIN_EMAIL, password: 'nope' })
        .expect(401);
      const wrongEmail = await request(http)
        .post('/api/auth/login')
        .send({ email: 'someone@test.local', password: TEST_ADMIN_PASSWORD })
        .expect(401);
      expect(wrongPassword.body).toEqual(wrongEmail.body);
    });

    it('rejects admin routes without or with a forged token', async () => {
      await request(http).get('/api/admin/projects').expect(401);
      await request(http)
        .get('/api/admin/projects')
        .set('Authorization', `Bearer ${token.slice(0, -2)}xx`)
        .expect(401);
    });
  });

  describe('projects', () => {
    let draftId: number;

    it('creates projects and rejects a duplicate slug', async () => {
      const created = await request(http)
        .post('/api/admin/projects')
        .set(admin())
        .send(project())
        .expect(201);
      expect(created.body).toMatchObject({ slug: 'night-drive', published: true, sortOrder: 0 });

      await request(http)
        .post('/api/admin/projects')
        .set(admin())
        .send(project({ slug: 'coffee', category: 'motion', orientation: 'vertical' }))
        .expect(201);

      const draft = await request(http)
        .post('/api/admin/projects')
        .set(admin())
        .send(project({ slug: 'draft', published: false }))
        .expect(201);
      draftId = draft.body.id;

      await request(http).post('/api/admin/projects').set(admin()).send(project()).expect(409);
    });

    it('validates input', async () => {
      await request(http)
        .post('/api/admin/projects')
        .set(admin())
        .send(project({ slug: 'Bad Slug', videoUrl: '//evil.example/x.mp4' }))
        .expect(400);
      await request(http)
        .post('/api/admin/projects')
        .set(admin())
        .send(project({ slug: 'backslash', videoUrl: '/\\evil.example/x.mp4' }))
        .expect(400);
      await request(http)
        .post('/api/admin/projects')
        .set(admin())
        .send(project({ slug: 'extra', isAdmin: true }))
        .expect(400);
      await request(http)
        .post('/api/admin/projects')
        .set(admin())
        .send(project({ slug: 'no-such-category', category: 'photo' }))
        .expect(400);
      await request(http)
        .patch(`/api/admin/projects/${draftId}`)
        .set(admin())
        .send({ title: null })
        .expect(400);
    });

    it('hides drafts and admin fields from the public list', async () => {
      const res = await request(http).get('/api/projects').expect(200);
      expect(res.body.map((p: { slug: string }) => p.slug)).toEqual(['night-drive', 'coffee']);
      expect(res.body[0]).not.toHaveProperty('published');
      expect(res.body[0]).not.toHaveProperty('createdAt');

      await request(http).get('/api/projects/draft').expect(404);
      await request(http).get('/api/projects/night-drive').expect(200);
    });

    it('filters by category and rejects unknown ones', async () => {
      const res = await request(http).get('/api/projects?category=motion').expect(200);
      expect(res.body.map((p: { slug: string }) => p.slug)).toEqual(['coffee']);
      const none = await request(http).get('/api/projects?category=photo').expect(200);
      expect(none.body).toEqual([]);
      await request(http).get('/api/projects?category=Bad%20Slug').expect(400);
    });

    it('patches without resetting omitted fields', async () => {
      const res = await request(http)
        .patch(`/api/admin/projects/${draftId}`)
        .set(admin())
        .send({ title: 'Renamed draft' })
        .expect(200);
      expect(res.body).toMatchObject({ title: 'Renamed draft', published: false, summary: 'A 30 second spot.' });
      await request(http).patch('/api/admin/projects/9999').set(admin()).send({ title: 'x' }).expect(404);
      await request(http)
        .patch(`/api/admin/projects/${draftId}`)
        .set(admin())
        .send({ slug: 'coffee' })
        .expect(409);
    });

    it('reorders only with the full set of ids', async () => {
      const all = await request(http).get('/api/admin/projects').set(admin()).expect(200);
      const ids: number[] = all.body.map((p: { id: number }) => p.id);

      await request(http)
        .put('/api/admin/projects/order')
        .set(admin())
        .send({ ids: ids.slice(1) })
        .expect(400);

      const reordered = await request(http)
        .put('/api/admin/projects/order')
        .set(admin())
        .send({ ids: [...ids].reverse() })
        .expect(200);
      expect(reordered.body.map((p: { id: number }) => p.id)).toEqual([...ids].reverse());
    });

    it('deletes', async () => {
      await request(http).delete(`/api/admin/projects/${draftId}`).set(admin()).expect(204);
      await request(http).delete(`/api/admin/projects/${draftId}`).set(admin()).expect(404);
    });
  });

  describe('uploads', () => {
    const uploadDir = process.env.UPLOAD_DIR!;

    it('has no S3 endpoints any more', async () => {
      await request(http).post('/api/admin/uploads/presign').set(admin()).send({}).expect(404);
      await request(http).post('/api/admin/uploads/confirm').set(admin()).send({}).expect(404);
    });

    it('reports disk usage to the admin only', async () => {
      await request(http).get('/api/admin/uploads/usage').expect(401);
      const res = await request(http).get('/api/admin/uploads/usage').set(admin()).expect(200);
      expect(res.body).toMatchObject({ minFreeBytes: 0, maxVideoBytes: 2048 * 1024 * 1024, maxImageBytes: 10 * 1024 * 1024 });
      expect(res.body.freeBytes).toBeGreaterThan(0);
      expect(res.body.totalBytes).toBeGreaterThanOrEqual(res.body.freeBytes);
    });

    it('requires auth', async () => {
      await request(http)
        .post('/api/admin/uploads')
        .attach('file', MP4_HEAD, 'clip.mp4')
        .expect(401);
    });

    it('stores a video under a generated name and serves it', async () => {
      const res = await request(http)
        .post('/api/admin/uploads')
        .set(admin())
        .attach('file', MP4_HEAD, '../../etc/passwd.mp4')
        .expect(201);
      expect(res.body).toMatchObject({ kind: 'video', size: MP4_HEAD.length });
      expect(res.body.url).toMatch(/^\/media\/[0-9a-f-]{36}\.mp4$/);
      await request(http).get(res.body.url).expect(200);
    });

    it('detects the type by content, not by name', async () => {
      const res = await request(http)
        .post('/api/admin/uploads')
        .set(admin())
        .attach('file', PNG_HEAD, 'poster.mp4')
        .expect(201);
      expect(res.body.url).toMatch(/\.png$/);
      expect(res.body.kind).toBe('image');
    });

    it('rejects unknown content and leaves no temp files', async () => {
      await request(http)
        .post('/api/admin/uploads')
        .set(admin())
        .attach('file', Buffer.from('<?php echo 1; ?>'), 'clip.mp4')
        .expect(400);
      await request(http).post('/api/admin/uploads').set(admin()).expect(400);
      expect(readdirSync(uploadDir).filter((f) => f.startsWith('.'))).toEqual([]);
    });

    it('does not serve dotfiles', async () => {
      expect(existsSync(join(uploadDir))).toBe(true);
      await request(http).get('/media/.upload-anything').expect(404);
    });

    it('counts stored files in the usage', async () => {
      const res = await request(http).get('/api/admin/uploads/usage').set(admin()).expect(200);
      expect(res.body.files).toBe(2);
      expect(res.body.usedBytes).toBe(MP4_HEAD.length + PNG_HEAD.length);
    });
  });

  describe('categories', () => {
    it('lists visible categories and manages them in the admin', async () => {
      const pub = await request(http).get('/api/categories').expect(200);
      expect(pub.body.map((c: { slug: string }) => c.slug)).toEqual(['reels', 'ads', 'motion', 'corporate', 'clips']);
      expect(pub.body[0]).not.toHaveProperty('visible');

      await request(http).post('/api/admin/categories').send({ slug: 'x', label: 'X', title: 'X' }).expect(401);
      const created = await request(http)
        .post('/api/admin/categories')
        .set(admin())
        .send({ slug: 'music-video', label: 'Клипы 2', title: 'Музыкальные видео', seoTitle: 'Клипы — Кирилл Зотов' })
        .expect(201);
      expect(created.body).toMatchObject({ slug: 'music-video', visible: true, projectCount: 0, sortOrder: 5 });
      await request(http)
        .post('/api/admin/categories')
        .set(admin())
        .send({ slug: 'music-video', label: 'Y', title: 'Y' })
        .expect(409);
      await request(http)
        .post('/api/admin/categories')
        .set(admin())
        .send({ slug: 'Bad Slug', label: 'Y', title: 'Y' })
        .expect(400);
      await request(http)
        .post('/api/admin/categories')
        .set(admin())
        .send({ slug: 'blank', label: '   ', title: 'Y' })
        .expect(400);
      await request(http)
        .patch(`/api/admin/categories/${created.body.id}`)
        .set(admin())
        .send({ slug: 'ads' })
        .expect(409);
      await request(http).patch('/api/admin/categories/9999').set(admin()).send({ label: 'x' }).expect(404);

      await request(http)
        .patch(`/api/admin/categories/${created.body.id}`)
        .set(admin())
        .send({ visible: false })
        .expect(200);
      const hidden = await request(http).get('/api/categories').expect(200);
      expect(hidden.body.map((c: { slug: string }) => c.slug)).not.toContain('music-video');

      await request(http).delete(`/api/admin/categories/${created.body.id}`).set(admin()).expect(204);
      await request(http).delete(`/api/admin/categories/${created.body.id}`).set(admin()).expect(404);
    });

    it('cascades a slug change to its works and refuses to delete a used category', async () => {
      const all = await request(http).get('/api/admin/categories').set(admin()).expect(200);
      const ads = all.body.find((c: { slug: string }) => c.slug === 'ads');
      expect(ads.projectCount).toBeGreaterThan(0);

      await request(http).delete(`/api/admin/categories/${ads.id}`).set(admin()).expect(409);
      await request(http).patch(`/api/admin/categories/${ads.id}`).set(admin()).send({ slug: 'reklama' }).expect(200);
      const works = await request(http).get('/api/projects?category=reklama').expect(200);
      expect(works.body.length).toBe(ads.projectCount);
      await request(http).patch(`/api/admin/categories/${ads.id}`).set(admin()).send({ slug: 'ads' }).expect(200);
    });

    it('reorders only with the full set of ids', async () => {
      const all = await request(http).get('/api/admin/categories').set(admin()).expect(200);
      const ids: number[] = all.body.map((c: { id: number }) => c.id);
      await request(http).put('/api/admin/categories/order').set(admin()).send({ ids: ids.slice(1) }).expect(400);
      const res = await request(http)
        .put('/api/admin/categories/order')
        .set(admin())
        .send({ ids: [...ids].reverse() })
        .expect(200);
      expect(res.body.map((c: { id: number }) => c.id)).toEqual([...ids].reverse());
      await request(http).put('/api/admin/categories/order').set(admin()).send({ ids }).expect(200);
    });
  });

  describe('services', () => {
    it('serves default cards with category slugs, then the saved ones', async () => {
      const before = await request(http).get('/api/services').expect(200);
      expect(before.body[0]).toMatchObject({ category: 'ads', fallback: 'motion', projectId: null });

      const cats = await request(http).get('/api/admin/categories').set(admin()).expect(200);
      const clips = cats.body.find((c: { slug: string }) => c.slug === 'clips');
      const card = { title: 'Клипы', text: 'Под ключ.', tags: ['4K', ' Цвет '], projectId: 1, categoryId: clips.id, fallbackId: null };

      await request(http).put('/api/admin/services').send({ items: [card] }).expect(401);
      const saved = await request(http).put('/api/admin/services').set(admin()).send({ items: [card] }).expect(200);
      expect(saved.body).toEqual([{ ...card, tags: ['4K', 'Цвет'], category: 'clips', fallback: null }]);
      expect((await request(http).get('/api/services').expect(200)).body).toEqual(saved.body);
    });

    it('forgets a deleted category so the cards can still be saved', async () => {
      const temp = await request(http)
        .post('/api/admin/categories')
        .set(admin())
        .send({ slug: 'temp-cat', label: 'Temp', title: 'Temp' })
        .expect(201);
      const card = { title: 'T', text: '', tags: [], projectId: null, categoryId: temp.body.id, fallbackId: temp.body.id };
      await request(http).put('/api/admin/services').set(admin()).send({ items: [card] }).expect(200);
      await request(http).delete(`/api/admin/categories/${temp.body.id}`).set(admin()).expect(204);

      const after = await request(http).get('/api/services').expect(200);
      expect(after.body[0]).toMatchObject({ categoryId: null, fallbackId: null, category: null, fallback: null });
      const { category: _c, fallback: _f, ...input } = after.body[0];
      await request(http).put('/api/admin/services').set(admin()).send({ items: [input] }).expect(200);
    });

    it('validates cards', async () => {
      const card = { title: 'X', text: '', tags: [], projectId: null, categoryId: 9999, fallbackId: null };
      await request(http).put('/api/admin/services').set(admin()).send({ items: [card] }).expect(400);
      await request(http)
        .put('/api/admin/services')
        .set(admin())
        .send({ items: Array.from({ length: 13 }, () => ({ ...card, categoryId: null })) })
        .expect(400);
    });
  });

  describe('seo', () => {
    it('stores page meta tags', async () => {
      const before = await request(http).get('/api/seo').expect(200);
      expect(before.body.about).toEqual({ title: '', description: '' });
      const seo = {
        home: { title: 'Главная', description: 'Портфолио' },
        works: { title: 'Работы', description: '' },
        about: { title: ' Обо мне ', description: 'Кто я' },
        privacy: { title: '', description: '' },
      };
      await request(http).put('/api/admin/seo').send(seo).expect(401);
      const saved = await request(http).put('/api/admin/seo').set(admin()).send(seo).expect(200);
      expect(saved.body.about).toEqual({ title: 'Обо мне', description: 'Кто я' });
      await request(http).put('/api/admin/seo').set(admin()).send({ ...seo, home: { title: 1 } }).expect(400);
      const { home: _home, ...withoutHome } = seo;
      await request(http).put('/api/admin/seo').set(admin()).send(withoutHome).expect(400);
    });
  });

  describe('removed contact form', () => {
    it('no longer accepts requests', async () => {
      await request(http)
        .post('/api/contact')
        .send({ name: 'x', email: 'x@example.com', message: 'hello there friend', consent: true })
        .expect(404);
    });
  });
});
