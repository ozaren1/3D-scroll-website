import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? 4000 : Number(value)))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;

  @IsString()
  @IsNotEmpty()
  DATABASE_PATH = './data/portfolio.db';

  @IsString()
  @IsNotEmpty()
  UPLOAD_DIR = './uploads';

  // Comma-separated list of allowed browser origins.
  @IsString()
  CORS_ORIGINS = 'http://localhost:3000';

  // Value for express "trust proxy": "false", "true", a hop count or a subnet list.
  @IsString()
  TRUST_PROXY = 'false';

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters' })
  JWT_SECRET: string;

  @IsString()
  @Matches(/^\d+[smhd]$/, { message: 'JWT_EXPIRES_IN must look like 12h, 30m or 7d' })
  JWT_EXPIRES_IN = '12h';

  // Where uploaded media goes: the local UPLOAD_DIR, or an S3-compatible bucket
  // (Yandex Object Storage, Selectel, VK Cloud, AWS…). The S3_* values are required for "s3".
  @IsIn(['local', 's3'])
  STORAGE_DRIVER: 'local' | 's3' = 'local';

  @IsOptional()
  @IsString()
  S3_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  S3_REGION?: string;

  @IsOptional()
  @IsString()
  S3_BUCKET?: string;

  @IsOptional()
  @IsString()
  S3_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  S3_SECRET_ACCESS_KEY?: string;

  // Public base URL of the bucket (or its CDN), e.g. https://storage.yandexcloud.net/my-bucket
  @IsOptional()
  @Matches(/^https:\/\/\S+[^/]$/, { message: 'S3_PUBLIC_URL must be an https URL without a trailing slash' })
  S3_PUBLIC_URL?: string;

  @IsOptional()
  @IsBooleanString()
  S3_FORCE_PATH_STYLE?: string;

  @IsEmail()
  ADMIN_EMAIL: string;

  @IsString()
  @Matches(/^\$2[aby]\$\d{2}\$.{53}$/, {
    message: 'ADMIN_PASSWORD_HASH must be a bcrypt hash (npm run hash-password)',
  })
  ADMIN_PASSWORD_HASH: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    exposeDefaultValues: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  const details = errors.flatMap((e) => Object.values(e.constraints ?? {}));
  if (validated.STORAGE_DRIVER === 's3') {
    const required = ['S3_REGION', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_PUBLIC_URL'] as const;
    for (const key of required) {
      if (!validated[key]) details.push(`${key} is required when STORAGE_DRIVER=s3`);
    }
  }
  if (details.length > 0) {
    throw new Error(`Invalid environment: ${details.join('; ')}`);
  }
  return validated;
}

export function parseTrustProxy(value: string): boolean | number | string {
  if (value === 'true') return true;
  if (value === 'false' || value === '') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}
