import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Controller('public')
export class RedirectController {
  
  // Redirigir /public/clinica/:clinicaUrl/exists a /api/public/clinica/:clinicaUrl/exists
  @Get('clinica/:clinicaUrl/exists')
  async redirectClinicaExists(
    @Param('clinicaUrl') clinicaUrl: string,
    @Res() res: Response,
  ) {
    const correctUrl = `/api/public/clinica/${clinicaUrl}/exists`;
    return res.redirect(HttpStatus.MOVED_PERMANENTLY, correctUrl);
  }

  // Redirigir /public/clinica/:clinicaUrl/landing a /api/public/clinica/:clinicaUrl/landing
  @Get('clinica/:clinicaUrl/landing')
  async redirectClinicaLanding(
    @Param('clinicaUrl') clinicaUrl: string,
    @Res() res: Response,
  ) {
    const correctUrl = `/api/public/clinica/${clinicaUrl}/landing`;
    return res.redirect(HttpStatus.MOVED_PERMANENTLY, correctUrl);
  }

  // Redirigir /public/clinica/:clinicaUrl/profesionales a /api/public/clinica/:clinicaUrl/profesionales
  @Get('clinica/:clinicaUrl/profesionales')
  async redirectProfessionals(
    @Param('clinicaUrl') clinicaUrl: string,
    @Res() res: Response,
  ) {
    const correctUrl = `/api/public/clinica/${clinicaUrl}/profesionales`;
    return res.redirect(HttpStatus.MOVED_PERMANENTLY, correctUrl);
  }

  // Redirigir /public/clinica/:clinicaUrl/debug-users a /api/public/clinica/:clinicaUrl/debug-users
  @Get('clinica/:clinicaUrl/debug-users')
  async redirectDebugUsers(
    @Param('clinicaUrl') clinicaUrl: string,
    @Res() res: Response,
  ) {
    const correctUrl = `/api/public/clinica/${clinicaUrl}/debug-users`;
    return res.redirect(HttpStatus.MOVED_PERMANENTLY, correctUrl);
  }
}
