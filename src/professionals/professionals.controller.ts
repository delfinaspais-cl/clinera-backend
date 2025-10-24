import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('clinica/:clinicaUrl/profesionales')
// @UseGuards(JwtAuthGuard) // Comentado para permitir pruebas sin autenticación
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  findAll(@Param('clinicaUrl') clinicaUrl: string) {
    return this.professionalsService.findAll(clinicaUrl);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateProfessionalDto,
  ) {
    return this.professionalsService.create(clinicaUrl, dto);
  }

  // @Post('test')
  // @UseGuards(JwtAuthGuard)
  // async testCreate(
  //   @Param('clinicaUrl') clinicaUrl: string,
  //   @Body() dto: any,
  // ) {
  //   try {
  //     console.log('🧪 Test endpoint - Datos recibidos:', JSON.stringify(dto, null, 2));
  //     console.log('🧪 Test endpoint - Clinica URL:', clinicaUrl);
      
  //     // Validar datos básicos
  //     if (!dto.name || !dto.email || !dto.password) {
  //       return {
  //         error: 'Datos requeridos faltantes',
  //         received: dto
  //       };
  //     }

  //     // Verificar estructura de specialties
  //     if (!Array.isArray(dto.specialties)) {
  //       return {
  //         error: 'specialties debe ser un array',
  //         received: dto.specialties,
  //         type: typeof dto.specialties
  //       };
  //     }

  //     return {
  //       success: true,
  //       message: 'Datos válidos recibidos',
  //       data: dto
  //     };
      
  //   } catch (error) {
  //     console.error('❌ Error en test endpoint:', error);
  //     return {
  //       error: 'Error interno',
  //       message: error.message,
  //       stack: error.stack
  //     };
  //   }
  // }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.professionalsService.findOne(clinicaUrl, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    return this.professionalsService.update(clinicaUrl, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.professionalsService.remove(clinicaUrl, id);
  }
}
