import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { S3StorageService } from './s3-storage.service.js';

const env: Record<string, string> = {
  STORAGE_DRIVER: 's3',
  S3_REGION: 'ru-central1',
  S3_BUCKET: 'portfolio',
  S3_PUBLIC_URL: 'https://storage.example/portfolio',
};
const config = {
  get: (key: string) => env[key],
  getOrThrow: (key: string) => env[key],
} as unknown as ConfigService;

const MP4_HEAD = Buffer.from([0, 0, 0, 0x18, ...Buffer.from('ftypmp42'), 0, 0, 0, 0]);
const KEY = 'incoming/0b5f3c2a-1111-4222-8333-944445555666.mp4';
const PUBLISHED = 'media/0b5f3c2a-1111-4222-8333-944445555666.mp4';

// A client whose GetObject returns the given head bytes and total size; records every command.
function fakeClient(head: Buffer, total: number) {
  const sent: unknown[] = [];
  const client = {
    send: async (command: unknown) => {
      sent.push(command);
      if (command instanceof HeadObjectCommand) return { ContentLength: total };
      if (command instanceof GetObjectCommand) {
        return { Body: { transformToByteArray: async () => new Uint8Array(head) } };
      }
      return {};
    },
  } as unknown as S3Client;
  return { client, sent };
}

describe('S3StorageService', () => {
  it('signs a POST limited to one key, the content type and the size limit', async () => {
    const client = new S3Client({
      region: 'ru-central1',
      endpoint: 'https://storage.example',
      forcePathStyle: true,
      credentials: { accessKeyId: 'AKIDEXAMPLE', secretAccessKey: 'secret' },
    });
    const storage = new S3StorageService(config, client);

    const res = await storage.presign('video/mp4', 1000);

    expect(res.mode).toBe('s3');
    expect(res.key).toMatch(/^incoming\/[0-9a-f-]{36}\.mp4$/);
    expect(res.fields['Content-Type']).toBe('video/mp4');
    const policy = JSON.parse(Buffer.from(res.fields.Policy, 'base64').toString());
    expect(policy.conditions).toContainEqual(['content-length-range', 1, 300 * 1024 * 1024]);
    expect(policy.conditions).toContainEqual(['eq', '$Content-Type', 'video/mp4']);
  });

  it('refuses files above the limit before signing', async () => {
    const storage = new S3StorageService(config, fakeClient(MP4_HEAD, 1).client);
    await expect(storage.presign('image/png', 11 * 1024 * 1024)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('publishes an upload whose bytes match its extension under media/', async () => {
    const { client, sent } = fakeClient(MP4_HEAD, 5000);
    const storage = new S3StorageService(config, client);
    await expect(storage.confirm(KEY)).resolves.toEqual({
      url: `https://storage.example/portfolio/${PUBLISHED}`,
      kind: 'video',
      size: 5000,
    });
    const copy = sent.find((c) => c instanceof CopyObjectCommand) as CopyObjectCommand;
    expect(copy.input).toMatchObject({ Key: PUBLISHED, CopySource: `portfolio/${KEY}` });
    expect(sent.some((c) => c instanceof DeleteObjectCommand)).toBe(true);
  });

  it('deletes and rejects an upload whose bytes do not match', async () => {
    const { client, sent } = fakeClient(Buffer.from('<html>not a video'), 20);
    const storage = new S3StorageService(config, client);
    await expect(storage.confirm(KEY)).rejects.toBeInstanceOf(BadRequestException);
    expect(sent.some((c) => c instanceof DeleteObjectCommand)).toBe(true);
  });

  it('rejects keys it did not issue', async () => {
    const storage = new S3StorageService(config, fakeClient(MP4_HEAD, 1).client);
    await expect(storage.confirm('../secret.mp4')).rejects.toBeInstanceOf(BadRequestException);
    await expect(storage.confirm(PUBLISHED)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('is disabled with the local driver', () => {
    const local = { ...config, get: (key: string) => (key === 'STORAGE_DRIVER' ? 'local' : env[key]) } as ConfigService;
    expect(new S3StorageService(local, null).enabled).toBe(false);
  });
});
