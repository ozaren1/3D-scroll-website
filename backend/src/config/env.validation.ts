import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEmail,
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
  if (errors.length > 0) {
    const details = errors
      .flatMap((e) => Object.values(e.constraints ?? {}))
      .join('; ');
    throw new Error(`Invalid environment: ${details}`);
  }
  return validated;
}

export function parseTrustProxy(value: string): boolean | number | string {
  if (value === 'true') return true;
  if (value === 'false' || value === '') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}
