import { Request, Response } from 'express';
import { AuthService, AuthTokenPayload } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
type AuthenticatedRequest = Request & {
    user: AuthTokenPayload;
};
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, response: Response): Promise<{
        message: string;
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    }>;
    login(dto: LoginDto, response: Response): Promise<{
        message: string;
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
    }>;
    getMe(request: AuthenticatedRequest): Promise<{
        id: number;
        name: string;
        email: string;
        role: string;
    }>;
    updateProfile(request: AuthenticatedRequest, dto: UpdateProfileDto): Promise<{
        id: number;
        name: string;
        email: string;
        role: string;
    }>;
    logout(response: Response): {
        message: string;
    };
}
export {};
