import { detectType } from './file-signature.js';

const bytes = (...parts: (number[] | string)[]) =>
  Buffer.concat(parts.map((p) => (typeof p === 'string' ? Buffer.from(p, 'latin1') : Buffer.from(p))));

describe('detectType', () => {
  it.each([
    ['jpg', bytes([0xff, 0xd8, 0xff, 0xe0])],
    ['png', bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ['webp', bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 ')],
    ['mp4', bytes([0, 0, 0, 0x20], 'ftypisom')],
    ['webm', bytes([0x1a, 0x45, 0xdf, 0xa3, 0, 0])],
  ])('recognises %s', (ext, head) => {
    expect(detectType(head)?.ext).toBe(ext);
  });

  it.each([
    ['text', bytes('hello world, not media')],
    ['RIFF that is not WEBP', bytes('RIFF', [0, 0, 0, 0], 'AVI LIST')],
    ['an empty buffer', Buffer.alloc(0)],
    ['a HEIC image', bytes([0, 0, 0, 0x18], 'ftypheic')],
    ['a QuickTime movie', bytes([0, 0, 0, 0x14], 'ftypqt  ')],
  ])('rejects %s', (_name, head) => {
    expect(detectType(head)).toBeNull();
  });
});
