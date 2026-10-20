"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const util_1 = require("util");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
const pbkdf2 = (0, util_1.promisify)(crypto.pbkdf2);
const TOKEN_LIFETIME_SECONDS = 60 * 60;
const TOKEN_ISSUER = 'iphone-stock-manager';
const TOKEN_AUDIENCE = 'iphone-stock-manager-web';
function deriveScryptKey(password, salt, keyLength, options) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, keyLength, options, (error, key) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(key);
        });
    });
}
let AuthService = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
        const secret = process.env.JWT_SECRET;
        if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
            throw new Error('JWT_SECRET must be configured with at least 32 bytes before starting the backend.');
        }
        this.jwtSecret = secret;
    }
    async hashPassword(password) {
        const salt = crypto.randomBytes(16);
        const key = await deriveScryptKey(password, salt, 64, {
            N: 32768,
            r: 8,
            p: 1,
            maxmem: 64 * 1024 * 1024,
        });
        return `scrypt$32768$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`;
    }
    async verifyPassword(password, storedHash) {
        const parts = storedHash.split('$');
        if (parts[0] === 'scrypt' && parts.length === 6) {
            const [, n, r, p, saltString, keyString] = parts;
            const N = Number(n);
            const blockSize = Number(r);
            const parallelization = Number(p);
            if (!Number.isSafeInteger(N) ||
                N < 16384 ||
                N > 65536 ||
                !Number.isSafeInteger(blockSize) ||
                blockSize < 1 ||
                blockSize > 16 ||
                !Number.isSafeInteger(parallelization) ||
                parallelization < 1 ||
                parallelization > 4) {
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
        const [salt, expectedHex] = storedHash.split(':');
        if (salt && expectedHex && /^[a-f0-9]{128}$/i.test(expectedHex)) {
            const expected = Buffer.from(expectedHex, 'hex');
            const actual = (await pbkdf2(password, salt, 1000, 64, 'sha512'));
            return {
                valid: crypto.timingSafeEqual(expected, actual),
                needsRehash: true,
            };
        }
        return { valid: false, needsRehash: false };
    }
    generateToken(userId) {
        const issuedAt = Math.floor(Date.now() / 1000);
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({
            sub: userId,
            iat: issuedAt,
            exp: issuedAt + TOKEN_LIFETIME_SECONDS,
            iss: TOKEN_ISSUER,
            aud: TOKEN_AUDIENCE,
        })).toString('base64url');
        const signature = crypto
            .createHmac('sha256', this.jwtSecret)
            .update(`${header}.${payload}`)
            .digest('base64url');
        return `${header}.${payload}.${signature}`;
    }
    verifyToken(token) {
        try {
            const segments = token.split('.');
            if (segments.length !== 3 || segments.some((segment) => !segment)) {
                return null;
            }
            const [headerSegment, payloadSegment, signatureSegment] = segments;
            const header = JSON.parse(Buffer.from(headerSegment, 'base64url').toString('utf8'));
            if (header.alg !== 'HS256' || header.typ !== 'JWT') {
                return null;
            }
            const expectedSignature = crypto
                .createHmac('sha256', this.jwtSecret)
                .update(`${headerSegment}.${payloadSegment}`)
                .digest();
            const actualSignature = Buffer.from(signatureSegment, 'base64url');
            if (actualSignature.length !== expectedSignature.length ||
                !crypto.timingSafeEqual(expectedSignature, actualSignature)) {
                return null;
            }
            const payload = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8'));
            const now = Math.floor(Date.now() / 1000);
            if (!Number.isSafeInteger(payload.sub) ||
                payload.sub <= 0 ||
                !Number.isSafeInteger(payload.iat) ||
                !Number.isSafeInteger(payload.exp) ||
                payload.iat > now ||
                payload.exp <= now ||
                payload.exp - payload.iat > TOKEN_LIFETIME_SECONDS ||
                payload.iss !== TOKEN_ISSUER ||
                payload.aud !== TOKEN_AUDIENCE) {
                return null;
            }
            return payload;
        }
        catch {
            return null;
        }
    }
    publicUser(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }
    async register(dto) {
        const email = dto.email.toLowerCase().trim();
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new common_1.ConflictException('This email is already registered. Use another email or sign in.');
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
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('This email is already registered. Use another email or sign in.');
            }
            throw error;
        }
    }
    async login(dto) {
        const email = dto.email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const result = await this.verifyPassword(dto.password, user.password);
        if (!result.valid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
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
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return this.publicUser(user);
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { name: dto.name.trim() },
        });
        return this.publicUser(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map