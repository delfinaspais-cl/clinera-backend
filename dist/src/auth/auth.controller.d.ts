import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterAuthDto): Promise<{
        access_token: string;
    }>;
    login(dto: LoginAuthDto): Promise<{
        access_token: string;
    }>;
}
