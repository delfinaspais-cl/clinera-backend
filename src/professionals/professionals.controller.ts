// import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
// import { ProfessionalsService } from './professionals.service';
// import { CreateProfessionalDto } from './dto/create-professional.dto';
// import { JwtAuthGuard } from '../auth/jwt.auth.guard';

// @Controller('professionals')
// @UseGuards(JwtAuthGuard)
// export class ProfessionalsController {
//   constructor(private readonly professionalsService: ProfessionalsService) {}

//   @Post()
//   create(@Body() dto: CreateProfessionalDto) {
//     return this.professionalsService.create(dto);
//   }

//   @Get()
//   findAll() {
//     return this.professionalsService.findAll();
//   }
// }