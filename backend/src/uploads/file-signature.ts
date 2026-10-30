import { open } from 'node:fs/promises';

export type MediaKind = 'video' | 'image';

// Accepted uploads: what the browser declares, and what the bytes must then turn out to be.
export const CONTENT_TYPES = {
  'video/mp4': { kind: 'video', ext: 'mp4' },
  'video/webm': { kind: 'video', ext: 'webm' },
  'image/jpeg': { kind: 'image', ext: 'jpg' },
  'image/png': { kind: 'image', ext: 'png' },
  'image/webp': { kind: 'image', ext: 'webp' },
} as const satisfies Record<string, DetectedType>;

export type AcceptedContentType = keyof typeof CONTENT_TYPES;

export interface DetectedType {
  kind: MediaKind;
  ext: 'mp4' | 'webm' | 'jpg' | 'png' | 'webp';
}

const startsWith = (buf: Buffer, bytes: number[], offset = 0) =>
  bytes.every((b, i) => buf[offset + i] === b);

const ascii = (buf: Buffer, start: number, end: number) =>
  buf.subarray(start, end).toString('latin1');

// ISO-BMFF major brands of MP4 video; QuickTime (qt), HEIC images and others are refused.
const MP4_BRANDS = new Set(['isom', 'iso2', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1', 'dash', 'M4V ', 'MSNV']);

// Identifies a file by its magic bytes; the client-supplied name and mimetype are ignored.
export function detectType(head: Buffer): DetectedType | null {
  if (startsWith(head, [0xff, 0xd8, 0xff])) return { kind: 'image', ext: 'jpg' };
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { kind: 'image', ext: 'png' };
  }
  if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WEBP') {
    return { kind: 'image', ext: 'webp' };
  }
  if (ascii(head, 4, 8) === 'ftyp' && MP4_BRANDS.has(ascii(head, 8, 12))) {
    return { kind: 'video', ext: 'mp4' };
  }
  if (startsWith(head, [0x1a, 0x45, 0xdf, 0xa3])) return { kind: 'video', ext: 'webm' };
  return null;
}

export async function detectFileType(path: string): Promise<DetectedType | null> {
  const handle = await open(path, 'r');
  try {
    const head = Buffer.alloc(16);
    const { bytesRead } = await handle.read(head, 0, head.length, 0);
    return detectType(head.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}
