import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Controller('public')
export class RedirectController {
  
  // REMOVIDO: Estos endpoints causaban redirección infinita
  // porque redirigían a la misma URL que ya incluye el prefijo /api
  
  // @Get('clinica/:clinicaUrl/exists')
  // async redirectClinicaExists(
  //   @Param('clinicaUrl') clinicaUrl: string,
  //   @Res() res: Response,
  // ) {
  //   const correctUrl = `/api/public/clinica/${clinicaUrl}/exists`;
  //   return res.redirect(HttpStatus.MOVED_PERMANENTLY, correctUrl);
  // }

  // @Get('clinica/:clinicaUrl/landing')
  // async redirectClinicaLanding(
  //   @Param('clinicaUrl') clinicaUrl: string,
  //   @Res() res: Response,
  // ) {
  //   const correctUrl = `/api/public/clinica/${clinicaUrl}/landing`;
  //   return res.redirect(HttpStatus.MOVED_PERMANENTLY, correctUrl);
  // }

  // @Get('clinica/:clinicaUrl/profesionales')
  // async redirectProfessionals(
  //   @Param('clinicaUrl') clinicaUrl: string,
  //   @Res() res: Response,
  // ) {
  //   const correctUrl = `/api/public/clinica/${clinicaUrl}/profesionales`;
  //   return res.redirect(HttpStatus.MOVED_PERMANENTLY, correctUrl);
  // }

  // @Get('clinica/:clinicaUrl/debug-users')
  // async redirectDebugUsers(
  //   @Param('clinicaUrl') clinicaUrl: string,
  //   @Res() res: Response,
  // ) {
  //   const correctUrl = `/api/public/clinica/${clinicaUrl}/debug-users`;
  //   return res.redirect(HttpStatus.MOVED_PERMANENTLY, correctUrl);
  // }
}
