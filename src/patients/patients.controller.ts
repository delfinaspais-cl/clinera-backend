import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-client.dto';
import { SearchPatientsDto } from './dto/search-patients.dto';

@ApiTags('Gestión de Pacientes')
@Controller('clinica/:clinicaUrl/pacientes')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(@Param('clinicaUrl') clinicaUrl: string) {
    return this.patientsService.findAll(clinicaUrl);
  }

  @Post()
  create(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreatePatientDto,
  ) {
    return this.patientsService.create(clinicaUrl, dto);
  }

  @Get(':id')
  findOne(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.patientsService.findOne(clinicaUrl, id);
  }

  @Patch(':id')
  update(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(clinicaUrl, id, dto);
  }

  @Delete(':id')
  remove(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.patientsService.remove(clinicaUrl, id);
  }

  @Get('mis-turnos')
  async getMisTurnos(@Request() req) {
    return this.patientsService.getMisTurnos(req.user.email);
  }

  @ApiOperation({ summary: 'Búsqueda avanzada de pacientes con filtros' })
  @ApiParam({ name: 'clinicaUrl', description: 'URL de la clínica' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pacientes filtrados con paginación',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        pacientes: { type: 'array' },
        pagination: { type: 'object' },
        filters: { type: 'object' },
      },
    },
  })
  @ApiBearerAuth()
  @Get('search')
  async searchPatients(
    @Request() req,
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() searchDto: SearchPatientsDto,
  ) {
    // Verificar que el usuario tenga acceso a esta clínica
    if (req.user.role === 'OWNER') {
      return this.patientsService.searchPatients(clinicaUrl, searchDto);
    } else if (
      req.user.role === 'ADMIN' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.patientsService.searchPatients(clinicaUrl, searchDto);
    } else if (
      req.user.role === 'SECRETARY' &&
      req.user.clinicaUrl === clinicaUrl
    ) {
      return this.patientsService.searchPatients(clinicaUrl, searchDto);
    } else {
      throw new Error(
        'Acceso denegado. No tienes permisos para buscar pacientes en esta clínica.',
      );
    }
  }
}
