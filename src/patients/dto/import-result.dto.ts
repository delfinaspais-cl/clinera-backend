import { ApiProperty } from '@nestjs/swagger';

/**
 * Detalle de un error de importación
 */
export class ImportErrorDetail {
  @ApiProperty({ description: 'Número de línea donde ocurrió el error' })
  linea: number;

  @ApiProperty({ description: 'Datos de la fila con error' })
  datos: any;

  @ApiProperty({ description: 'Mensaje de error descriptivo' })
  error: string;
}

/**
 * Resultado de la importación de pacientes
 */
export class ImportResultDto {
  @ApiProperty({ description: 'Indica si la operación fue exitosa' })
  success: boolean;

  @ApiProperty({ description: 'Mensaje general del resultado' })
  message: string;

  @ApiProperty({ description: 'Total de filas procesadas' })
  totalProcesados: number;

  @ApiProperty({ description: 'Total de pacientes creados exitosamente' })
  exitosos: number;

  @ApiProperty({ description: 'Total de errores encontrados' })
  errores: number;

  @ApiProperty({ description: 'Total de duplicados omitidos' })
  duplicados: number;

  @ApiProperty({ description: 'Detalles de los errores', type: [ImportErrorDetail] })
  detallesErrores: ImportErrorDetail[];

  @ApiProperty({ description: 'IDs de los pacientes creados' })
  pacientesCreados: string[];

  @ApiProperty({ description: 'Tiempo de procesamiento en milisegundos' })
  tiempoProcesamiento: number;
}

/**
 * DTO para opciones de importación
 */
export class ImportOptionsDto {
  @ApiProperty({ 
    description: 'Estrategia para duplicados: skip (omitir) o update (actualizar)',
    enum: ['skip', 'update'],
    default: 'skip'
  })
  duplicateStrategy?: 'skip' | 'update' = 'skip';

  @ApiProperty({ 
    description: 'Campo para detectar duplicados',
    enum: ['email', 'documento', 'both'],
    default: 'email'
  })
  duplicateField?: 'email' | 'documento' | 'both' = 'email';

  @ApiProperty({ 
    description: 'Validar sin importar (dry-run)',
    default: false
  })
  dryRun?: boolean = false;
}

