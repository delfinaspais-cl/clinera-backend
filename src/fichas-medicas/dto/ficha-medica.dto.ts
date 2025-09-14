import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FichaMedicaDto {
  @ApiProperty({ description: 'ID de la ficha médica' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: 'Grupo sanguíneo del paciente' })
  @IsOptional()
  @IsString()
  grupoSanguineo?: string;

  @ApiProperty({ description: 'Alergias del paciente' })
  @IsOptional()
  @IsString()
  alergias?: string;

  @ApiProperty({ description: 'Medicamentos actuales del paciente' })
  @IsOptional()
  @IsString()
  medicamentosActuales?: string;

  @ApiProperty({ description: 'Antecedentes patológicos' })
  @IsOptional()
  @IsString()
  antecedentesPatologicos?: string;

  @ApiProperty({ description: 'Antecedentes quirúrgicos' })
  @IsOptional()
  @IsString()
  antecedentesQuirurgicos?: string;

  @ApiProperty({ description: 'Antecedentes familiares' })
  @IsOptional()
  @IsString()
  antecedentesFamiliares?: string;

  @ApiProperty({ description: 'Hábitos del paciente' })
  @IsOptional()
  @IsString()
  habitos?: string;

  @ApiProperty({ description: 'Ocupación del paciente' })
  @IsOptional()
  @IsString()
  ocupacion?: string;

  @ApiProperty({ description: 'Motivo de consulta' })
  @IsOptional()
  @IsString()
  motivoConsulta?: string;

  @ApiProperty({ description: 'Síntomas del paciente' })
  @IsOptional()
  @IsString()
  sintomas?: string;

  @ApiProperty({ description: 'Diagnóstico' })
  @IsOptional()
  @IsString()
  diagnostico?: string;

  @ApiProperty({ description: 'Tratamiento' })
  @IsOptional()
  @IsString()
  tratamiento?: string;

  @ApiProperty({ description: 'Evolución del paciente' })
  @IsOptional()
  @IsString()
  evolucion?: string;

  @ApiProperty({ description: 'Tratamientos estéticos previos del paciente' })
  @IsOptional()
  @IsString()
  tratamientosEsteticosPrevios?: string;
}

export class FichaMedicaResponseDto extends FichaMedicaDto {
  @ApiProperty({ description: 'Lista de archivos médicos' })
  archivos: ArchivoMedicoDto[];

  @ApiProperty({ description: 'Lista de imágenes médicas' })
  imagenes: ImagenMedicaDto[];
}

export class ArchivoMedicoDto {
  @ApiProperty({ description: 'ID del archivo' })
  id: string;

  @ApiProperty({ description: 'Nombre del archivo' })
  nombre: string;

  @ApiProperty({ description: 'Tipo de archivo' })
  tipo: string;

  @ApiProperty({ description: 'URL del archivo' })
  url: string;

  @ApiProperty({ description: 'Fecha de subida' })
  fecha: string;
}

export class ImagenMedicaDto {
  @ApiProperty({ description: 'ID de la imagen' })
  id: string;

  @ApiProperty({ description: 'Nombre de la imagen' })
  nombre: string;

  @ApiProperty({ description: 'URL de la imagen' })
  url: string;

  @ApiProperty({ description: 'Fecha de subida' })
  fecha: string;

  @ApiProperty({ description: 'Descripción de la imagen' })
  descripcion?: string;
}
