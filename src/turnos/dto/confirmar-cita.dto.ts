import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmarCitaDto {
  @ApiProperty({
    description: 'Motivo opcional para la confirmación',
    example: 'Confirmo mi asistencia',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'El motivo no puede exceder los 500 caracteres' })
  motivo?: string;
}
