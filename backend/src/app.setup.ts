import { resolve } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { parseTrustProxy } from './config/env.validation.js';

// Shared by main.ts and the e2e tests so both run the same HTTP pipeline.
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(ConfigService);

  app.set('trust proxy', parseTrustProxy(config.getOrThrow<string>('TRUST_PROXY')));
  app.disable('x-powered-by');
  app.use(
    helmet({
      // Media is embedded by the frontend, which lives on another origin.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors({
    origin: config
      .getOrThrow<string>('CORS_ORIGINS')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useStaticAssets(resolve(config.getOrThrow<string>('UPLOAD_DIR')), {
    prefix: '/media/',
    dotfiles: 'deny',
    index: false,
    maxAge: '30d',
    immutable: true,
  });
  app.enableShutdownHooks();
}
