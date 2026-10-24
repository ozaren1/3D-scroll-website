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

      const profile = {
        ...before.body,
        name: 'Test Person',
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
      await request(http).get('/api/projects?category=editing').expect(400);
      const res = await request(http).get('/api/projects?category=motion').expect(200);
      expect(res.body.map((p: { slug: string }) => p.slug)).toEqual(['coffee']);
      await request(http).get('/api/projects?category=photo').expect(400);
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
  });

  // Last: it exhausts the contact rate limit.
  describe('contact', () => {
    const message = {
      name: 'Dana',
      email: 'dana@example.com',
      message: 'Need a 30 second ad cut from interviews.',
      consent: true,
    };

    it('stores a request and lets the admin read and archive it', async () => {
      const res = await request(http)
        .post('/api/contact')
        .send({ ...message, budget: '  200 000 ₸  ' })
        .expect(201);
      expect(res.body.id).toBeGreaterThan(0);

      const list = await request(http).get('/api/admin/contacts').set(admin()).expect(200);
      const { consent: _consent, ...stored } = message;
      expect(list.body[0]).toMatchObject({ ...stored, budget: '200 000 ₸', status: 'new' });
      expect(list.body[0].consentedAt).toEqual(expect.any(String));

      await request(http)
        .patch(`/api/admin/contacts/${res.body.id}`)
        .set(admin())
        .send({ status: 'archived' })
        .expect(200);
      const archived = await request(http)
        .get('/api/admin/contacts?status=archived')
        .set(admin())
        .expect(200);
      expect(archived.body).toHaveLength(1);
      await request(http).patch('/api/admin/contacts/9999').set(admin()).send({ status: 'read' }).expect(404);
    });

    it('validates, requires consent and silently drops honeypot submissions', async () => {
      await request(http).post('/api/contact').send({ ...message, message: 'short' }).expect(400);
      await request(http).post('/api/contact').send({ ...message, consent: 'true' }).expect(400);
      const { consent: _c, ...withoutConsent } = message;
      await request(http).post('/api/contact').send(withoutConsent).expect(400);
      const res = await request(http)
        .post('/api/contact')
        .send({ ...message, website: 'http://spam.example' })
        .expect(201);
      expect(res.body).toEqual({ id: 0 });
      const list = await request(http).get('/api/admin/contacts').set(admin()).expect(200);
      expect(list.body).toHaveLength(1);
    });

    it('rate-limits submissions', async () => {
      // 5 requests were made above (validation failures count too); the limit is 5 per 10 minutes.
      await request(http).post('/api/contact').send(message).expect(429);
    });
  });
});
