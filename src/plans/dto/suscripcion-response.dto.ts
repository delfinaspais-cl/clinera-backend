import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanResponseDto } from './plan-response.dto';

export class SuscripcionResponseDto {
  @ApiProperty({ description: 'ID de la suscripción' })
  id: string;

  @ApiProperty({ description: 'ID de la clínica' })
  clinicaId: string;

  @ApiProperty({ description: 'Estado de la suscripción' })
  estado: string;

  @ApiProperty({ description: 'Fecha de inicio' })
  fechaInicio: Date;

  @ApiPropertyOptional({ description: 'Fecha de fin' })
  fechaFin?: Date;

  @ApiPropertyOptional({ description: 'Fecha de fin del período de prueba' })
  fechaTrialFin?: Date;

  @ApiPropertyOptional({ description: 'Último pago' })
  ultimoPago?: Date;

  @ApiPropertyOptional({ description: 'Próximo pago' })
  proximoPago?: Date;

  @ApiPropertyOptional({ description: 'Método de pago' })
  metodoPago?: string;

  @ApiPropertyOptional({ description: 'ID del pago externo' })
  idPagoExterno?: string;

  @ApiPropertyOptional({ description: 'Notas' })
  notas?: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  @ApiProperty({ description: 'Plan asociado' })
  plan: PlanResponseDto;
}
