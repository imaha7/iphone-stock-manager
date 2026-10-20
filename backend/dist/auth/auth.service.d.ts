import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
export interface AuthTokenPayload {
    sub: number;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtSecret;
    constructor(prisma: PrismaService);
    private hashPassword;
    private verifyPassword;
    private generateToken;
    verifyToken(token: string): AuthTokenPayload | null;
    private publicUser;
    register(dto: RegisterDto): Promise<{
        message: string;
        token: string;
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        message: string;
        token: string;
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    }>;
    getMe(userId: number): Promise<{
        id: number;
        name: string;
        email: string;
        role: string;
    }>;
    updateProfile(userId: number, dto: UpdateProfileDto): Promise<{
        id: number;
        name: string;
        email: string;
        role: string;
    }>;
}
