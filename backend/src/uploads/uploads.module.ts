import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createS3Client, S3_CLIENT, S3StorageService } from './s3-storage.service.js';
import { UploadsController } from './uploads.controller.js';
import { MAX_VIDEO_BYTES, TEMP_PREFIX, UploadsService } from './uploads.service.js';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dir = config.getOrThrow<string>('UPLOAD_DIR');
        mkdirSync(dir, { recursive: true });
        return {
          storage: diskStorage({
            destination: dir,
            // Dot-prefixed temp name: the static handler refuses dotfiles.
            filename: (_req, _file, cb) => cb(null, `${TEMP_PREFIX}${randomUUID()}`),
          }),
          limits: { fileSize: MAX_VIDEO_BYTES, files: 1, fields: 0 },
        };
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [
    UploadsService,
    S3StorageService,
    { provide: S3_CLIENT, inject: [ConfigService], useFactory: createS3Client },
  ],
})
export class UploadsModule {}
