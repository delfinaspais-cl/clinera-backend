import { ApiProperty } from '@nestjs/swagger';
import { PlanResponseDto } from './plan-response.dto';

export class EstadoSuscripcionDto {
  @ApiProperty({ description: 'ID de la clínica' })
  clinicaId: string;

  @ApiProperty({ description: 'Nombre de la clínica' })
  clinicaNombre: string;

  @ApiProperty({ description: 'Estado actual de la suscripción' })
  estado: string;

  @ApiProperty({ description: 'Plan actual' })
  plan: PlanResponseDto;

  @ApiProperty({ description: 'Fecha de inicio del período de prueba' })
  fechaInicioTrial: Date;

  @ApiProperty({ description: 'Fecha de fin del período de prueba' })
  fechaFinTrial: Date;

  @ApiProperty({ description: 'Días restantes del período de prueba' })
  diasRestantesTrial: number;

  @ApiProperty({ description: 'Si está en período de prueba' })
  enTrial: boolean;

  @ApiProperty({ description: 'Si la suscripción está activa' })
  activa: boolean;

  @ApiProperty({ description: 'Estadísticas de uso' })
  uso: {
    profesionales: number;
    turnos: number;
    limiteProfesionales: number;
    limiteTurnos: number;
    limiteAlmacenamiento: string;
  };

  @ApiPropertyOptional({ description: 'Próximo pago' })
  proximoPago?: Date;

  @ApiPropertyOptional({ description: 'Último pago' })
  ultimoPago?: Date;
}
