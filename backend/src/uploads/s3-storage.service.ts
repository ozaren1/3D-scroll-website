import { randomUUID } from 'node:crypto';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import {
  BadRequestException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CONTENT_TYPES,
  detectType,
  type AcceptedContentType,
  type MediaKind,
} from './file-signature.js';
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from './uploads.service.js';

export const S3_CLIENT = Symbol('S3_CLIENT');

// Uploads land under incoming/ (not public, expired by a bucket lifecycle rule) and are copied to
// media/ (public) only after confirm has checked them.
const INCOMING = 'incoming/';
const PUBLIC = 'media/';
const KEY_PATTERN = /^incoming\/[0-9a-f-]{36}\.(mp4|webm|jpg|png|webp)$/;
const PRESIGN_SECONDS = 15 * 60;

export const limitFor = (kind: MediaKind) => (kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES);

export interface PresignedUpload {
  mode: 's3';
  url: string;
  fields: Record<string, string>;
  key: string;
}

// Direct browser-to-bucket uploads: the API signs a POST policy limited to one key, one content type
// and the size limit, then checks the stored bytes before the URL is handed out.
@Injectable()
export class S3StorageService {
  constructor(
    private readonly config: ConfigService,
    @Optional() @Inject(S3_CLIENT) private readonly client: S3Client | null,
  ) {}

  get enabled(): boolean {
    return this.config.get<string>('STORAGE_DRIVER') === 's3' && this.client !== null;
  }

  private get bucket(): string {
    return this.config.getOrThrow<string>('S3_BUCKET');
  }

  private publicUrl(key: string): string {
    return `${this.config.getOrThrow<string>('S3_PUBLIC_URL')}/${key}`;
  }

  private requireClient(): S3Client {
    if (!this.enabled || !this.client) throw new BadRequestException('S3 storage is not configured');
    return this.client;
  }

  async presign(contentType: AcceptedContentType, size: number): Promise<PresignedUpload> {
    const client = this.requireClient();
    const { kind, ext } = CONTENT_TYPES[contentType];
    const limit = limitFor(kind);
    if (size > limit) {
      throw new BadRequestException(`${kind} must be at most ${Math.round(limit / 1024 / 1024)} MB`);
    }
    const key = `${INCOMING}${randomUUID()}.${ext}`;
    const { url, fields } = await createPresignedPost(client, {
      Bucket: this.bucket,
      Key: key,
      Conditions: [
        ['content-length-range', 1, limit],
        ['eq', '$Content-Type', contentType],
      ],
      Fields: { 'Content-Type': contentType },
      Expires: PRESIGN_SECONDS,
    });
    return { mode: 's3', url, fields, key };
  }

  // Checks the uploaded object (size, first bytes) and publishes it under media/;
  // anything that is not what its name claims is deleted.
  async confirm(key: string): Promise<{ url: string; kind: MediaKind; size: number }> {
    const client = this.requireClient();
    if (!KEY_PATTERN.test(key)) throw new BadRequestException('Unknown upload key');
    const ext = key.slice(key.lastIndexOf('.') + 1);

    let head: Buffer;
    let size: number;
    try {
      const meta = await client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      size = meta.ContentLength ?? 0;
      const object = await client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key, Range: 'bytes=0-15' }),
      );
      head = Buffer.from(await object.Body!.transformToByteArray());
    } catch {
      throw new BadRequestException('Upload not found');
    }

    const remove = () =>
      client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })).catch(() => undefined);
    const type = detectType(head);
    if (!type || type.ext !== ext || size < 1 || size > limitFor(type.kind)) {
      await remove();
      throw new BadRequestException('Uploaded file is not a supported mp4, webm, jpg, png or webp');
    }

    const target = PUBLIC + key.slice(INCOMING.length);
    await client.send(
      new CopyObjectCommand({ Bucket: this.bucket, Key: target, CopySource: `${this.bucket}/${key}` }),
    );
    await remove();
    return { url: this.publicUrl(target), kind: type.kind, size };
  }
}

export function createS3Client(config: ConfigService): S3Client | null {
  if (config.get<string>('STORAGE_DRIVER') !== 's3') return null;
  return new S3Client({
    region: config.getOrThrow<string>('S3_REGION'),
    endpoint: config.get<string>('S3_ENDPOINT') || undefined,
    forcePathStyle: ['true', '1'].includes(config.get<string>('S3_FORCE_PATH_STYLE') ?? ''),
    credentials: {
      accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
      secretAccessKey: config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
    },
  });
}
