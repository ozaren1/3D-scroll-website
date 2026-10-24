import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

export const ADMIN_SUBJECT = 'admin';

@Injectable()
export class AuthService {
  // Hash of a random string with the admin hash's cost: compared against when the
  // e-mail is wrong, so both failure paths take the same time.
  private readonly dummyHash: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    const rounds = bcrypt.getRounds(
      this.config.getOrThrow<string>('ADMIN_PASSWORD_HASH'),
    );
    this.dummyHash = bcrypt.hashSync(randomUUID(), rounds);
  }

  async login(email: string, password: string) {
    const adminEmail = this.config.getOrThrow<string>('ADMIN_EMAIL');
    const adminHash = this.config.getOrThrow<string>('ADMIN_PASSWORD_HASH');

    const emailMatches =
      email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
    const passwordMatches = await bcrypt.compare(
      password,
      emailMatches ? adminHash : this.dummyHash,
    );
    if (!emailMatches || !passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const expiresIn = this.config.getOrThrow<string>('JWT_EXPIRES_IN');
    const accessToken = await this.jwt.signAsync({ sub: ADMIN_SUBJECT });
    return { accessToken, expiresIn };
  }
}
