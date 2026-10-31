import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);
  // Node drops requests after 5 minutes by default: too short for a large video on a slow uplink.
  // This applies to every request, so the API must sit behind a proxy that times out slow clients itself.
  app.getHttpServer().requestTimeout = 2 * 60 * 60 * 1000;
  await app.listen(app.get(ConfigService).getOrThrow<number>('PORT'));
}
await bootstrap();
