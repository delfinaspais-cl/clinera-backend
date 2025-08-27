import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('clinica/:clinicaUrl/tratamientos')
@UseGuards(JwtAuthGuard)
export class TratamientosController {
  
  @Get()
  async getTratamientos(@Param('clinicaUrl') clinicaUrl: string) {
    // Por ahora, retornamos una lista estática de tratamientos
    // En el futuro, esto vendría de la base de datos
    return {
      success: true,
      data: [
        {
          id: 'tratamiento-1',
          nombre: 'Consulta General',
          descripcion: 'Consulta médica general',
          duracion: 30,
        },
        {
          id: 'tratamiento-2',
          nombre: 'Ortodoncia',
          descripcion: 'Tratamiento de ortodoncia',
          duracion: 60,
        },
        {
          id: 'tratamiento-3',
          nombre: 'Limpieza Dental',
          descripcion: 'Limpieza y profilaxis dental',
          duracion: 45,
        },
        {
          id: 'tratamiento-4',
          nombre: 'Extracción',
          descripcion: 'Extracción dental',
          duracion: 30,
        },
        {
          id: 'tratamiento-5',
          nombre: 'Empaste',
          descripcion: 'Empaste dental',
          duracion: 45,
        },
        {
          id: 'tratamiento-6',
          nombre: 'Endodoncia',
          descripcion: 'Tratamiento de conducto',
          duracion: 90,
        },
      ],
    };
  }
}
