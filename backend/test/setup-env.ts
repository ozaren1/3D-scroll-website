import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import bcrypt from 'bcryptjs';
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from './constants.js';

// Runs before any test module is imported, so ConfigModule validates these values.

process.env.DATABASE_PATH = ':memory:';
process.env.UPLOAD_DIR = mkdtempSync(join(tmpdir(), 'portfolio-uploads-'));
process.env.MIN_FREE_MB = '0';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.TRUST_PROXY = 'false';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-validation';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ADMIN_EMAIL = TEST_ADMIN_EMAIL;
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(TEST_ADMIN_PASSWORD, 4);
