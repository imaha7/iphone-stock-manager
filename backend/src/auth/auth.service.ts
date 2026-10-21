import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { promisify } from 'util';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const pbkdf2 = promisify(crypto.pbkdf2);
const TOKEN_LIFETIME_SECONDS = 60 * 60;
const TOKEN_ISSUER = 'iphone-stock-manager';
const TOKEN_AUDIENCE = 'iphone-stock-manager-web';

function deriveScryptKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: crypto.ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, options, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key as Buffer);
    });
  });
}

export interface AuthTokenPayload {
  sub: number;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_SECRET is not available to the backend. Configure it in the production environment before starting the backend.',
      );
    }
    if (Buffer.byteLength(secret, 'utf8') < 32) {
      throw new Error(
        'JWT_SECRET must be configured with at least 32 bytes before starting the backend.',
      );
    }
    this.jwtSecret = secret;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    const key = await deriveScryptKey(password, salt, 64, {
      N: 32768,
      r: 8,
      p: 1,
      maxmem: 64 * 1024 * 1024,
    });
    return `scrypt$32768$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`;
  }

  private async verifyPassword(
    password: string,
    storedHash: string,
  ): Promise<{ valid: boolean; needsRehash: boolean }> {
    const parts = storedHash.split('$');
    if (parts[0] === 'scrypt' && parts.length === 6) {
      const [, n, r, p, saltString, keyString] = parts;
      const N = Number(n);
      const blockSize = Number(r);
      const parallelization = Number(p);
      if (
        !Number.isSafeInteger(N) ||
        N < 16384 ||
        N > 65536 ||
        !Number.isSafeInteger(blockSize) ||
        blockSize < 1 ||
        blockSize > 16 ||
        !Number.isSafeInteger(parallelization) ||
        parallelization < 1 ||
        parallelization > 4
      ) {
        return { valid: false, needsRehash: false };
      }

      const salt = Buffer.from(saltString, 'base64url');
      const originalKey = Buffer.from(keyString, 'base64url');
      if (salt.length !== 16 || originalKey.length !== 64) {
        return { valid: false, needsRehash: false };
      }

      const key = await deriveScryptKey(password, salt, originalKey.length, {
        N,
        r: blockSize,
        p: parallelization,
        maxmem: 64 * 1024 * 1024,
      });
      return {
        valid: crypto.timingSafeEqual(originalKey, key),
        needsRehash: false,
      };
    }

    // Upgrade passwords stored by the previous PBKDF2 implementation after login.
    const [salt, expectedHex] = storedHash.split(':');
    if (salt && expectedHex && /^[a-f0-9]{128}$/i.test(expectedHex)) {
      const expected = Buffer.from(expectedHex, 'hex');
      const actual = (await pbkdf2(password, salt, 1000, 64, 'sha512')) as Buffer;
      return {
        valid: crypto.timingSafeEqual(expected, actual),
        needsRehash: true,
      };
    }

    return { valid: false, needsRehash: false };
  }

  private generateToken(userId: number): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: userId,
        iat: issuedAt,
        exp: issuedAt + TOKEN_LIFETIME_SECONDS,
        iss: TOKEN_ISSUER,
        aud: TOKEN_AUDIENCE,
      }),
    ).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');
    return `${header}.${payload}.${signature}`;
  }

  verifyToken(token: string): AuthTokenPayload | null {
    try {
      const segments = token.split('.');
      if (segments.length !== 3 || segments.some((segment) => !segment)) {
        return null;
      }

      const [headerSegment, payloadSegment, signatureSegment] = segments;
      const header = JSON.parse(
        Buffer.from(headerSegment, 'base64url').toString('utf8'),
      );
      if (header.alg !== 'HS256' || header.typ !== 'JWT') {
        return null;
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${headerSegment}.${payloadSegment}`)
        .digest();
      const actualSignature = Buffer.from(signatureSegment, 'base64url');
      if (
        actualSignature.length !== expectedSignature.length ||
        !crypto.timingSafeEqual(expectedSignature, actualSignature)
      ) {
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(payloadSegment, 'base64url').toString('utf8'),
      ) as AuthTokenPayload;
      const now = Math.floor(Date.now() / 1000);
      if (
        !Number.isSafeInteger(payload.sub) ||
        payload.sub <= 0 ||
        !Number.isSafeInteger(payload.iat) ||
        !Number.isSafeInteger(payload.exp) ||
        payload.iat > now ||
        payload.exp <= now ||
        payload.exp - payload.iat > TOKEN_LIFETIME_SECONDS ||
        payload.iss !== TOKEN_ISSUER ||
        payload.aud !== TOKEN_AUDIENCE
      ) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  private publicUser(user: { id: number; name: string; email: string; role: string }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(
        'This email is already registered. Use another email or sign in.',
      );
    }

    const password = await this.hashPassword(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email,
          password,
          role: 'staff',
        },
      });
      return {
        message: 'Registration successful',
        token: this.generateToken(user.id),
        user: this.publicUser(user),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This email is already registered. Use another email or sign in.',
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const result = await this.verifyPassword(dto.password, user.password);
    if (!result.valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (result.needsRehash) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: await this.hashPassword(dto.password) },
      });
    }

    return {
      message: 'Login successful',
      token: this.generateToken(user.id),
      user: this.publicUser(user),
    };
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.publicUser(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name.trim() },
    });
    return this.publicUser(user);
  }
}
