// import { Controller, Get, UseGuards, Req } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/jwt.auth.guard';
// import { PatientsService } from './patients.service';

// @Controller('patients')
// @UseGuards(JwtAuthGuard)
// export class PatientsController {
//   constructor(private readonly patientsService: PatientsService) {}

//   @Get()
//   findAll(@Req() req) {
//     return this.patientsService.findAll(); // req.user para acceder a los datos del token
//   }
// }