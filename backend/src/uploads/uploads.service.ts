import { randomUUID } from 'node:crypto';
import { rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { detectFileType, type MediaKind } from './file-signature.js';

export const MAX_VIDEO_BYTES = 300 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const TEMP_PREFIX = '.upload-';

export interface StoredFile {
  url: string;
  kind: MediaKind;
  size: number;
}

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  get uploadDir(): string {
    return this.config.getOrThrow<string>('UPLOAD_DIR');
  }

  async store(file: Express.Multer.File | undefined): Promise<StoredFile> {
    if (!file) throw new BadRequestException('File is required (field "file")');
    try {
      const type = await detectFileType(file.path);
      if (!type) {
        throw new BadRequestException('Unsupported file type: use mp4, webm, jpg, png or webp');
      }
      const limit = type.kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (file.size > limit) {
        throw new PayloadTooLargeException(
          `${type.kind} must be at most ${Math.round(limit / 1024 / 1024)} MB`,
        );
      }
      const name = `${randomUUID()}.${type.ext}`;
      await rename(file.path, join(this.uploadDir, name));
      return { url: `/media/${name}`, kind: type.kind, size: file.size };
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
      throw error;
    }
  }
}
