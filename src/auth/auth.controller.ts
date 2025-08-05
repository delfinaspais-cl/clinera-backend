import { Body, Controller, Post, Headers, UseGuards } from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { OwnerLoginDto } from './dto/owner-login.dto';
import { ClinicaLoginDto } from './dto/clinica-login.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginAuthDto) {
    return this.authService.loginWithDto(dto);
  }

  @Post('owner/login')
  ownerLogin(@Body() dto: OwnerLoginDto) {
    return this.authService.ownerLogin(dto);
  }

  @Post('owner/logout')
  @UseGuards(JwtAuthGuard)
  ownerLogout(@Headers('authorization') auth: string) {
    const token = auth.replace('Bearer ', '');
    return this.authService.ownerLogout(token);
  }

  @Post('clinica/login')
  clinicaLogin(@Body() dto: ClinicaLoginDto) {
    return this.authService.clinicaLogin(dto);
  }

  @Post('clinica/logout')
  @UseGuards(JwtAuthGuard)
  clinicaLogout(@Headers('authorization') auth: string) {
    const token = auth.replace('Bearer ', '');
    return this.authService.clinicaLogout(token);
  }
}

