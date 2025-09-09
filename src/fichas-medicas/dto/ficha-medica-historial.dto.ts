import { IsString, IsOptional, IsUUID, IsInt, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// DTO para datos básicos de la ficha médica
export class DatosBasicosDto {
  @ApiProperty({ description: 'Grupo sanguíneo del paciente', required: false })
  @IsOptional()
  @IsString()
  grupoSanguineo?: string;

  @ApiProperty({ description: 'Ocupación del paciente', required: false })
  @IsOptional()
  @IsString()
  ocupacion?: string;

  @ApiProperty({ description: 'Alergias del paciente', required: false })
  @IsOptional()
  @IsString()
  alergias?: string;

  @ApiProperty({ description: 'Medicamentos actuales del paciente', required: false })
  @IsOptional()
  @IsString()
  medicamentosActuales?: string;

  @ApiProperty({ description: 'Antecedentes patológicos', required: false })
  @IsOptional()
  @IsString()
  antecedentesPatologicos?: string;

  @ApiProperty({ description: 'Antecedentes quirúrgicos', required: false })
  @IsOptional()
  @IsString()
  antecedentesQuirurgicos?: string;

  @ApiProperty({ description: 'Antecedentes familiares', required: false })
  @IsOptional()
  @IsString()
  antecedentesFamiliares?: string;

  @ApiProperty({ description: 'Hábitos del paciente', required: false })
  @IsOptional()
  @IsString()
  habitos?: string;
}

// DTO para historia clínica
export class HistoriaClinicaDto {
  @ApiProperty({ description: 'Motivo de consulta', required: false })
  @IsOptional()
  @IsString()
  motivoConsulta?: string;

  @ApiProperty({ description: 'Síntomas del paciente', required: false })
  @IsOptional()
  @IsString()
  sintomas?: string;

  @ApiProperty({ description: 'Diagnóstico', required: false })
  @IsOptional()
  @IsString()
  diagnostico?: string;

  @ApiProperty({ description: 'Tratamiento', required: false })
  @IsOptional()
  @IsString()
  tratamiento?: string;

  @ApiProperty({ description: 'Evolución del paciente', required: false })
  @IsOptional()
  @IsString()
  evolucion?: string;
}

// DTO para crear nueva versión
export class CrearVersionFichaMedicaDto {
  @ApiProperty({ description: 'Datos básicos del paciente' })
  @ValidateNested()
  @Type(() => DatosBasicosDto)
  datosBasicos?: DatosBasicosDto;

  @ApiProperty({ description: 'Historia clínica' })
  @ValidateNested()
  @Type(() => HistoriaClinicaDto)
  historiaClinica?: HistoriaClinicaDto;

  @ApiProperty({ description: 'Notas sobre los cambios realizados', required: false })
  @IsOptional()
  @IsString()
  notasCambio?: string;
}

// DTO para archivo médico en historial
export class ArchivoMedicoHistorialDto {
  @ApiProperty({ description: 'ID del archivo' })
  id: string;

  @ApiProperty({ description: 'Tipo de archivo (archivo o imagen)' })
  tipo: string;

  @ApiProperty({ description: 'Nombre del archivo' })
  nombre: string;

  @ApiProperty({ description: 'URL del archivo' })
  url: string;

  @ApiProperty({ description: 'Descripción del archivo', required: false })
  descripcion?: string;

  @ApiProperty({ description: 'Fecha de subida' })
  fechaSubida: string;
}

// DTO para información del creador
export class CreadorDto {
  @ApiProperty({ description: 'ID del usuario' })
  id: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  nombre: string;

  @ApiProperty({ description: 'Especialidad del profesional', required: false })
  especialidad?: string;
}

// DTO para respuesta de ficha médica actual
export class FichaMedicaHistorialResponseDto {
  @ApiProperty({ description: 'ID de la versión' })
  id: string;

  @ApiProperty({ description: 'ID del paciente' })
  pacienteId: string;

  @ApiProperty({ description: 'Número de versión' })
  version: number;

  @ApiProperty({ description: 'Fecha de creación' })
  fechaCreacion: string;

  @ApiProperty({ description: 'Información del creador' })
  creadoPor: CreadorDto;

  @ApiProperty({ description: 'Datos básicos del paciente' })
  datosBasicos: DatosBasicosDto;

  @ApiProperty({ description: 'Historia clínica' })
  historiaClinica: HistoriaClinicaDto;

  @ApiProperty({ description: 'Lista de archivos médicos' })
  archivos: ArchivoMedicoHistorialDto[];

  @ApiProperty({ description: 'Lista de imágenes médicas' })
  imagenes: ArchivoMedicoHistorialDto[];

  @ApiProperty({ description: 'Notas sobre los cambios', required: false })
  notasCambio?: string;

  @ApiProperty({ description: 'Indica si es la versión actual' })
  esVersionActual: boolean;
}

// DTO para versión en historial
export class VersionHistorialDto {
  @ApiProperty({ description: 'ID de la versión' })
  id: string;

  @ApiProperty({ description: 'Número de versión' })
  version: number;

  @ApiProperty({ description: 'Fecha de creación' })
  fechaCreacion: string;

  @ApiProperty({ description: 'Nombre del creador' })
  creadoPor: string;

  @ApiProperty({ description: 'Notas sobre los cambios', required: false })
  notasCambio?: string;

  @ApiProperty({ description: 'Indica si es la versión actual' })
  esVersionActual: boolean;

  @ApiProperty({ description: 'Resumen de los cambios realizados' })
  resumenCambios: string;
}

// DTO para respuesta del historial completo
export class HistorialFichaMedicaResponseDto {
  @ApiProperty({ description: 'Información del paciente' })
  paciente: {
    id: string;
    nombre: string;
    email: string;
  };

  @ApiProperty({ description: 'Lista de versiones' })
  versiones: VersionHistorialDto[];

  @ApiProperty({ description: 'Total de versiones' })
  totalVersiones: number;
}

// DTO para diferencia entre versiones
export class DiferenciaVersionDto {
  @ApiProperty({ description: 'Campo que cambió' })
  campo: string;

  @ApiProperty({ description: 'Valor anterior' })
  valorAnterior: string;

  @ApiProperty({ description: 'Valor nuevo' })
  valorNuevo: string;

  @ApiProperty({ description: 'Tipo de cambio' })
  tipo: 'agregado' | 'modificado' | 'eliminado';
}

// DTO para respuesta de comparación
export class ComparacionFichaMedicaResponseDto {
  @ApiProperty({ description: 'Versión 1' })
  version1: FichaMedicaHistorialResponseDto;

  @ApiProperty({ description: 'Versión 2' })
  version2: FichaMedicaHistorialResponseDto;

  @ApiProperty({ description: 'Lista de diferencias' })
  diferencias: DiferenciaVersionDto[];

  @ApiProperty({ description: 'Archivos agregados' })
  archivosAgregados: ArchivoMedicoHistorialDto[];

  @ApiProperty({ description: 'Archivos eliminados' })
  archivosEliminados: ArchivoMedicoHistorialDto[];

  @ApiProperty({ description: 'Imágenes agregadas' })
  imagenesAgregadas: ArchivoMedicoHistorialDto[];

  @ApiProperty({ description: 'Imágenes eliminadas' })
  imagenesEliminadas: ArchivoMedicoHistorialDto[];
}

// DTO para subir archivo a versión específica
export class SubirArchivoVersionDto {
  @ApiProperty({ description: 'Tipo de archivo (archivo o imagen)' })
  @IsString()
  tipo: string;

  @ApiProperty({ description: 'Descripción del archivo', required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

// DTO para filtros de búsqueda
export class FiltrosFichasMedicasDto {
  @ApiProperty({ description: 'Término de búsqueda', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Fecha desde', required: false })
  @IsOptional()
  @IsString()
  fechaDesde?: string;

  @ApiProperty({ description: 'Fecha hasta', required: false })
  @IsOptional()
  @IsString()
  fechaHasta?: string;

  @ApiProperty({ description: 'ID del doctor', required: false })
  @IsOptional()
  @IsString()
  doctorId?: string;
}

// DTO para estadísticas
export class EstadisticasFichasMedicasDto {
  @ApiProperty({ description: 'Total de fichas médicas' })
  totalFichas: number;

  @ApiProperty({ description: 'Fichas actualizadas en los últimos 30 días' })
  fichasActualizadas30Dias: number;

  @ApiProperty({ description: 'Fichas que necesitan actualización' })
  fichasPendientesActualizacion: number;

  @ApiProperty({ description: 'Promedio de versiones por ficha' })
  promedioVersionesPorFicha: number;
}

// DTO para pacientes con fichas recientes
export class PacienteFichaRecienteDto {
  @ApiProperty({ description: 'ID del paciente' })
  id: string;

  @ApiProperty({ description: 'Nombre del paciente' })
  nombre: string;

  @ApiProperty({ description: 'Email del paciente' })
  email: string;

  @ApiProperty({ description: 'Fecha de última actualización' })
  ultimaActualizacion: string;

  @ApiProperty({ description: 'Versión actual' })
  versionActual: number;
}
