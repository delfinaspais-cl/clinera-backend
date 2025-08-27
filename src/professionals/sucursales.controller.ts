import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('clinica/:clinicaUrl/sucursales')
@UseGuards(JwtAuthGuard)
export class SucursalesController {
  
  @Get()
  async getSucursales(@Param('clinicaUrl') clinicaUrl: string) {
    // Por ahora, retornamos una lista estática de sucursales
    // En el futuro, esto vendría de la base de datos
    return {
      success: true,
      data: [
        {
          id: 'sucursal-1',
          nombre: 'Sucursal Centro',
          direccion: 'Av. Principal 123, Centro',
          telefono: '+54 9 11 1234-5678',
        },
        {
          id: 'sucursal-2',
          nombre: 'Sucursal Norte',
          direccion: 'Calle Norte 456, Zona Norte',
          telefono: '+54 9 11 2345-6789',
        },
        {
          id: 'sucursal-3',
          nombre: 'Sucursal Sur',
          direccion: 'Av. Sur 789, Zona Sur',
          telefono: '+54 9 11 3456-7890',
        },
      ],
    };
  }
}
