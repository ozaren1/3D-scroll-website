import type { statfs } from 'node:fs/promises';
import { HttpStatus } from '@nestjs/common';
import { ensureFreeSpace } from './uploads.service.js';

const disk = (freeBytes: number) =>
  (async () => ({ bavail: freeBytes / 4096, bsize: 4096 })) as unknown as typeof statfs;

describe('ensureFreeSpace', () => {
  it('accepts an upload that leaves the reserve free', async () => {
    await expect(ensureFreeSpace('/x', 1000 * 4096, 1000 * 4096, disk(3000 * 4096))).resolves.toBeUndefined();
  });

  it('refuses with 507 when the upload would eat into the reserve', async () => {
    await expect(ensureFreeSpace('/x', 2500 * 4096, 1000 * 4096, disk(3000 * 4096))).rejects.toMatchObject({
      status: HttpStatus.INSUFFICIENT_STORAGE,
    });
  });
});
