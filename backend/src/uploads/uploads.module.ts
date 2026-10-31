import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { MediaSweeper } from './media-sweeper.js';
import { UploadsController } from './uploads.controller.js';
import { maxVideoBytes, TEMP_PREFIX, UploadsService } from './uploads.service.js';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dir = config.getOrThrow<string>('UPLOAD_DIR');
        mkdirSync(dir, { recursive: true });
        return {
          // Streams straight to disk, so even a multi-gigabyte video never sits in memory.
          storage: diskStorage({
            destination: dir,
            // Dot-prefixed temp name: the static handler refuses dotfiles.
            filename: (_req, _file, cb) => cb(null, `${TEMP_PREFIX}${randomUUID()}`),
          }),
          limits: { fileSize: maxVideoBytes(config), files: 1, fields: 0 },
        };
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService, MediaSweeper],
})
export class UploadsModule {}
