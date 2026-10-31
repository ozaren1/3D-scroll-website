import { randomUUID } from 'node:crypto';
import { readdir, rename, stat, statfs, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { detectFileType, type MediaKind } from './file-signature.js';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const TEMP_PREFIX = '.upload-';
const MB = 1024 * 1024;

export interface StoredFile {
  url: string;
  kind: MediaKind;
  size: number;
}

export interface DiskUsage {
  usedBytes: number;
  files: number;
  freeBytes: number;
  totalBytes: number;
  minFreeBytes: number;
  maxVideoBytes: number;
  maxImageBytes: number;
}

export const maxVideoBytes = (config: ConfigService) => config.getOrThrow<number>('MAX_VIDEO_MB') * MB;

// Throws 507 when writing `incoming` bytes would leave less than `minFree` on the disk.
export async function ensureFreeSpace(
  dir: string,
  incoming: number,
  minFree: number,
  statDisk: typeof statfs = statfs,
): Promise<void> {
  const disk = await statDisk(dir);
  if (disk.bavail * disk.bsize - incoming < minFree) {
    throw new HttpException('Not enough free disk space on the server', HttpStatus.INSUFFICIENT_STORAGE);
  }
}

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  get uploadDir(): string {
    return this.config.getOrThrow<string>('UPLOAD_DIR');
  }

  get minFreeBytes(): number {
    return this.config.getOrThrow<number>('MIN_FREE_MB') * MB;
  }

  // Checked before the body is read. Without a Content-Length (chunked) the largest allowed file is assumed.
  ensureRoomFor(declared: number | null): Promise<void> {
    const incoming = declared ?? maxVideoBytes(this.config);
    return ensureFreeSpace(this.uploadDir, incoming, this.minFreeBytes);
  }

  async store(file: Express.Multer.File | undefined): Promise<StoredFile> {
    if (!file) throw new BadRequestException('File is required (field "file")');
    try {
      const type = await detectFileType(file.path);
      if (!type) {
        throw new BadRequestException('Unsupported file type: use mp4, webm, jpg, png or webp');
      }
      const limit = type.kind === 'video' ? maxVideoBytes(this.config) : MAX_IMAGE_BYTES;
      if (file.size > limit) {
        throw new PayloadTooLargeException(`${type.kind} must be at most ${Math.round(limit / MB)} MB`);
      }
      const name = `${randomUUID()}.${type.ext}`;
      await rename(file.path, join(this.uploadDir, name));
      return { url: `/media/${name}`, kind: type.kind, size: file.size };
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
      throw error;
    }
  }

  async usage(): Promise<DiskUsage> {
    let usedBytes = 0;
    let files = 0;
    for (const name of await readdir(this.uploadDir)) {
      if (name.startsWith('.')) continue;
      const info = await stat(join(this.uploadDir, name)).catch(() => null);
      if (!info?.isFile()) continue;
      usedBytes += info.size;
      files += 1;
    }
    const disk = await statfs(this.uploadDir);
    return {
      usedBytes,
      files,
      freeBytes: disk.bavail * disk.bsize,
      totalBytes: disk.blocks * disk.bsize,
      minFreeBytes: this.minFreeBytes,
      maxVideoBytes: maxVideoBytes(this.config),
      maxImageBytes: MAX_IMAGE_BYTES,
    };
  }
}
