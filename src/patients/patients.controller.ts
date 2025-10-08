import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
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
  @ApiOperation({ summary: 'Listar pacientes con paginación' })
  @ApiResponse({ status: 200, description: 'Lista de pacientes obtenida exitosamente' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, email o teléfono' })
  async findAll(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20; // Límite por defecto más pequeño
    return this.patientsService.findAll(clinicaUrl, pageNum, limitNum, search);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear nuevo paciente' })
  @ApiResponse({ status: 201, description: 'Paciente creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Clínica no encontrada' })
  async create(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreatePatientDto,
  ) {
    return this.patientsService.create(clinicaUrl, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.patientsService.findOne(clinicaUrl, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(clinicaUrl, id, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar paciente completo' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async updatePatient(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() dto: any, // Usar any para evitar validación
  ) {
    return this.patientsService.updatePatient(clinicaUrl, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('clinicaUrl') clinicaUrl: string, @Param('id') id: string) {
    return this.patientsService.remove(clinicaUrl, id);
  }

  @Get('mis-turnos')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async searchPatients(
    @Param('clinicaUrl') clinicaUrl: string,
    @Query() searchDto: SearchPatientsDto,
  ) {
    return this.patientsService.searchPatients(clinicaUrl, searchDto);
  }
}
