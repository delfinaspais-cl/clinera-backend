import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Readable } from 'stream';
import * as fastcsv from 'fast-csv';
import { ImportResultDto, ImportErrorDetail, ImportOptionsDto } from './dto/import-result.dto';

interface RawPatientRow {
  [key: string]: any;
}

@Injectable()
export class PatientsImportService {
  private readonly logger = new Logger(PatientsImportService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Importa pacientes desde un archivo CSV
   */
  async importFromCSV(
    file: Express.Multer.File,
    clinicaId: string,
    options: ImportOptionsDto = {},
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const result: ImportResultDto = {
      success: true,
      message: '',
      totalProcesados: 0,
      exitosos: 0,
      errores: 0,
      duplicados: 0,
      detallesErrores: [],
      pacientesCreados: [],
      tiempoProcesamiento: 0,
    };

    try {
      // 1. Validar archivo
      this.validateFile(file);

      // 2. Parsear CSV
      const rows = await this.parseCSV(file);
      result.totalProcesados = rows.length;

      this.logger.log(`Procesando ${rows.length} filas del CSV para clínica ${clinicaId}`);

      // 3. Procesar cada fila
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const lineNumber = index + 2; // +2 porque +1 es el header y el índice empieza en 0

        try {
          // 3.1 Mapear columnas flexibles (nombre+apellido, RUT/DNI, etc.)
          const patientData = await this.mapFlexibleColumns(row, clinicaId);

          // 3.2 Validar datos
          const validationError = await this.validatePatientData(patientData, clinicaId);
          if (validationError) {
            result.errores++;
            result.detallesErrores.push({
              linea: lineNumber,
              datos: row,
              error: validationError,
            });
            continue;
          }

          // 3.3 Verificar duplicados
          const isDuplicate = await this.checkDuplicate(
            patientData,
            clinicaId,
            options.duplicateField || 'email',
          );

          if (isDuplicate) {
            if (options.duplicateStrategy === 'skip') {
              result.duplicados++;
              this.logger.debug(`Duplicado omitido en línea ${lineNumber}: ${patientData.email || patientData.documento}`);
              continue;
            } else if (options.duplicateStrategy === 'update') {
              // TODO: Implementar actualización en el futuro
              result.duplicados++;
              continue;
            }
          }

          // 3.4 Crear paciente (solo si no es dry-run)
          if (!options.dryRun) {
            const createdPatient = await this.prisma.patient.create({
              data: patientData,
            });
            result.pacientesCreados.push(createdPatient.id);
            result.exitosos++;

            // 3.5 Crear/Actualizar contacto para mensajería (si tiene email y teléfono)
            if (createdPatient.email || createdPatient.phone) {
              await this.syncContact(createdPatient, clinicaId);
            }
          } else {
            result.exitosos++;
          }

        } catch (error) {
          this.logger.error(`Error procesando línea ${lineNumber}:`, error);
          result.errores++;
          result.detallesErrores.push({
            linea: lineNumber,
            datos: row,
            error: error.message || 'Error desconocido',
          });
        }
      }

      // 4. Preparar mensaje final
      result.tiempoProcesamiento = Date.now() - startTime;
      result.success = result.errores === 0 || result.exitosos > 0;
      result.message = this.buildResultMessage(result, options.dryRun || false);

      this.logger.log(`Importación completada: ${result.exitosos} exitosos, ${result.errores} errores, ${result.duplicados} duplicados`);

      return result;

    } catch (error) {
      this.logger.error('Error en importación de CSV:', error);
      throw new BadRequestException(`Error al procesar archivo CSV: ${error.message}`);
    }
  }

  /**
   * Exporta pacientes a CSV
   */
  async exportToCSV(clinicaId: string): Promise<string> {
    try {
      const patients = await this.prisma.patient.findMany({
        where: { clinicaId },
        orderBy: { createdAt: 'desc' },
      });

      if (patients.length === 0) {
        throw new BadRequestException('No hay pacientes para exportar');
      }

      // Crear CSV manualmente con headers
      const headers = [
        'name',
        'email',
        'phone',
        'birthDate',
        'documento',
        'clientNumber',
        'address',
        'city',
        'province',
        'country',
        'gender',
        'preExistingConditions',
        'notes',
      ];

      let csv = headers.join(',') + '\n';

      for (const patient of patients) {
        const row = [
          this.escapeCsvValue(patient.name),
          this.escapeCsvValue(patient.email || ''),
          this.escapeCsvValue(patient.phone || ''),
          patient.birthDate ? patient.birthDate.toISOString().split('T')[0] : '',
          this.escapeCsvValue(patient.documento || ''),
          this.escapeCsvValue(patient.clientNumber || ''),
          this.escapeCsvValue(patient.address || ''),
          this.escapeCsvValue(patient.city || ''),
          this.escapeCsvValue(patient.province || ''),
          this.escapeCsvValue(patient.country || ''),
          this.escapeCsvValue(patient.gender || ''),
          this.escapeCsvValue(patient.preExistingConditions || ''),
          this.escapeCsvValue(patient.notes || ''),
        ];
        csv += row.join(',') + '\n';
      }

      this.logger.log(`Exportados ${patients.length} pacientes a CSV`);
      return csv;

    } catch (error) {
      this.logger.error('Error exportando a CSV:', error);
      throw new BadRequestException(`Error al exportar pacientes: ${error.message}`);
    }
  }

  /**
   * Valida el archivo subido
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    // Validar extensión
    const allowedExtensions = ['.csv', '.txt'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException('El archivo debe ser .csv o .txt');
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo no puede superar los 5MB');
    }

    // Validar MIME type
    const allowedMimeTypes = ['text/csv', 'text/plain', 'application/csv'];
    if (file.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
      this.logger.warn(`MIME type no estándar: ${file.mimetype}, pero permitiendo por extensión`);
    }
  }

  /**
   * Parsea el archivo CSV y retorna las filas
   */
  private async parseCSV(file: Express.Multer.File): Promise<RawPatientRow[]> {
    return new Promise((resolve, reject) => {
      const rows: RawPatientRow[] = [];
      
      // Convertir buffer a string con encoding UTF-8
      const fileContent = file.buffer.toString('utf-8');
      
      // Detectar el delimitador automáticamente
      const delimiter = this.detectDelimiter(fileContent);
      this.logger.log(`Delimitador detectado: "${delimiter}"`);
      
      const stream = Readable.from(file.buffer);

      stream
        .pipe(
          fastcsv.parse({
            headers: true,
            trim: true,
            ignoreEmpty: true,
            delimiter: delimiter,
            encoding: 'utf8',
          }),
        )
        .on('error', (error) => {
          this.logger.error('Error parseando CSV:', error);
          reject(new BadRequestException('Error al leer el archivo CSV. Verifique el formato.'));
        })
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', () => {
          if (rows.length === 0) {
            reject(new BadRequestException('El archivo CSV está vacío'));
          }
          this.logger.log(`CSV parseado exitosamente: ${rows.length} filas encontradas`);
          resolve(rows);
        });
    });
  }

  /**
   * Detecta automáticamente el delimitador del CSV
   */
  private detectDelimiter(content: string): string {
    // Obtener las primeras líneas para analizar
    const lines = content.split('\n').slice(0, 5);
    
    // Contar ocurrencias de diferentes delimitadores
    const delimiterCounts = {
      ',': 0,
      ';': 0,
      '\t': 0,
      '|': 0,
    };

    lines.forEach(line => {
      Object.keys(delimiterCounts).forEach(delimiter => {
        const matches = line.split(delimiter).length - 1;
        delimiterCounts[delimiter] += matches;
      });
    });

    // Encontrar el delimitador más común
    const maxCount = Math.max(...Object.values(delimiterCounts));
    const detectedDelimiter = Object.keys(delimiterCounts).find(
      delimiter => delimiterCounts[delimiter] === maxCount
    );

    // Si no hay delimitadores detectados, usar coma por defecto
    return detectedDelimiter && maxCount > 0 ? detectedDelimiter : ',';
  }

  /**
   * Mapea columnas flexibles del CSV a nuestro modelo
   * Soporta: nombre+apellido, RUT/DNI/CURP/CPF/SSN, telefono/celular/phone, etc.
   * Idiomas: Español, Portugués (Brasil), Inglés (USA), y variaciones
   */
  private async mapFlexibleColumns(row: RawPatientRow, clinicaId: string): Promise<any> {
    const mapped: any = { clinicaId };

    // Función auxiliar para buscar columnas con variaciones de caracteres especiales
    const findColumn = (variations: string[]): string | null => {
      for (const variation of variations) {
        if (row[variation] && row[variation].toString().trim()) {
          return row[variation].toString().trim();
        }
      }
      return null;
    };

    // 1. NAME: Combinar nombre + apellido si existen separados
    // Español: nombre + apellido (con y sin tildes)
    // Portugués: nome + sobrenome
    // Inglés: first_name/firstname + last_name/lastname
    const nombre = findColumn(['nombre', 'Nombre', 'NOMBRE']);
    const apellido = findColumn(['apellido', 'apellidos', 'Apellidos', 'APELLIDOS']);
    
    if (nombre && apellido) {
      mapped.name = `${nombre} ${apellido}`.trim();
    } else if (row['nome'] && row['sobrenome']) {
      mapped.name = `${row['nome']} ${row['sobrenome']}`.trim();
    } else if (row['first_name'] && row['last_name']) {
      mapped.name = `${row['first_name']} ${row['last_name']}`.trim();
    } else if (row['firstname'] && row['lastname']) {
      mapped.name = `${row['firstname']} ${row['lastname']}`.trim();
    } else if (nombre) {
      mapped.name = nombre;
    } else if (row['nome']) {
      mapped.name = row['nome'];
    } else if (row['name']) {
      mapped.name = row['name'];
    } else if (row['nombre_completo']) {
      mapped.name = row['nombre_completo'];
    } else if (row['full_name']) {
      mapped.name = row['full_name'];
    } else if (row['fullname']) {
      mapped.name = row['fullname'];
    }

    // 2. DOCUMENTO: Soportar múltiples nombres (RUT, DNI, CURP, CPF, SSN, etc.)
    // Español: documento, DNI, RUT, CURP, pasaporte
    // Portugués: documento, CPF
    // Inglés: document, SSN, passport, ID
    mapped.documento =
      row['documento'] ||
      row['RUT'] ||
      row['rut'] ||
      row['DNI'] ||
      row['dni'] ||
      row['CURP'] ||
      row['curp'] ||
      row['CPF'] ||
      row['cpf'] ||
      row['SSN'] ||
      row['ssn'] ||
      row['passport'] ||
      row['pasaporte'] ||
      row['Pasaporte'] ||
      row['document'] ||
      row['ID'] ||
      row['id'] ||
      null;

    // Limpiar documento (quitar puntos y guiones comunes en RUT/DNI)
    if (mapped.documento) {
      mapped.documento = mapped.documento.toString().trim();
    }

    // 3. EMAIL
    // Español: email, correo, correo_electronico, mail
    // Portugués: email, e-mail, correio
    // Inglés: email, e-mail, mail
    mapped.email = findColumn([
      'email', 'Email', 'EMAIL',
      'e-mail', 'E-mail', 'E-MAIL',
      'correo', 'Correo', 'CORREO',
      'correo_electronico', 'correo electrónico',
      'mail', 'Mail', 'MAIL',
      'correio'
    ]);

    if (mapped.email) {
      mapped.email = mapped.email.toLowerCase().trim();
    }

    // 4. PHONE: Soportar telefono/celular/movil (con y sin tildes)
    // Español: telefono, celular, movil
    // Portugués: telefone, celular
    // Inglés: phone, mobile, cell, cellphone
    mapped.phone = findColumn([
      'phone', 
      'telefono', 'Telefono', 'TELFONO', 'teléfono', 'Teléfono', 'TELÉFONO',
      'telefone', 
      'celular', 'Celular', 'CELULAR',
      'movil', 'Movil', 'MOVIL', 'móvil', 'Móvil', 'MÓVIL',
      'mobile', 
      'cell', 
      'cellphone'
    ]);

    if (mapped.phone) {
      mapped.phone = mapped.phone.toString().trim();
    }

    // 5. BIRTHDATE: Parsear fechas flexibles
    // Español: fecha_nacimiento, fechaNacimiento, fecha_nac
    // Portugués: data_nascimento, dataNascimento, data_nasc
    // Inglés: birthDate, birth_date, date_of_birth, dob
    const birthDateRaw =
      row['birthDate'] ||
      row['birth_date'] ||
      row['date_of_birth'] ||
      row['dob'] ||
      row['fecha_nacimiento'] ||
      row['fechaNacimiento'] ||
      row['fecha_nac'] ||
      row['Fecha_Nacimiento'] ||
      row['data_nascimento'] ||
      row['dataNascimento'] ||
      row['data_nasc'] ||
      null;

    if (birthDateRaw) {
      const parsedDate = this.parseFlexibleDate(birthDateRaw);
      if (parsedDate) {
        mapped.birthDate = parsedDate;
      }
    }

    // 6. GENDER: Normalizar género
    // Español: genero, sexo
    // Portugués: genero, sexo
    // Inglés: gender, sex
    const genderRaw = 
      row['gender'] || 
      row['genero'] || 
      row['Genero'] || 
      row['sexo'] || 
      row['sex'] || 
      null;
    if (genderRaw) {
      mapped.gender = this.normalizeGender(genderRaw);
    }

    // 7. Resto de campos con nombres estándar
    // CLIENT NUMBER
    mapped.clientNumber = 
      row['clientNumber'] || 
      row['client_number'] || 
      row['numero_cliente'] || 
      row['numero_paciente'] ||
      row['patient_number'] ||
      null;
    
    // ADDRESS
    // Español: direccion (con y sin tildes)
    // Portugués: endereco, endereço
    // Inglés: address
    mapped.address = findColumn([
      'address', 
      'direccion', 'Direccion', 'DIRECCION', 'dirección', 'Dirección', 'DIRECCIÓN',
      'endereco', 'endereço'
    ]);
    
    // CITY
    // Español: ciudad
    // Portugués: cidade
    // Inglés: city
    mapped.city = 
      row['city'] || 
      row['ciudad'] || 
      row['Ciudad'] || 
      row['cidade'] ||
      null;
    
    // PROVINCE/STATE
    // Español: provincia, region
    // Portugués: estado, província
    // Inglés: province, state, region
    mapped.province = 
      row['province'] || 
      row['provincia'] || 
      row['Provincia'] || 
      row['region'] || 
      row['Region'] || 
      row['estado'] ||
      row['state'] ||
      row['província'] ||
      null;
    
    // COUNTRY
    // Español: pais, país
    // Portugués: pais, país
    // Inglés: country
    mapped.country = 
      row['country'] || 
      row['pais'] || 
      row['país'] || 
      row['Pais'] || 
      null;
    
    // NOTES
    // Español: notas, observaciones
    // Portugués: notas, observações
    // Inglés: notes, comments, observations
    mapped.notes = 
      row['notes'] || 
      row['notas'] || 
      row['Notas'] || 
      row['observaciones'] || 
      row['observações'] ||
      row['comments'] ||
      row['observations'] ||
      null;
    
    // PRE-EXISTING CONDITIONS
    // Español: condiciones_preexistentes, condiciones
    // Portugués: condicoes_preexistentes, condições
    // Inglés: preExistingConditions, medical_conditions, conditions
    mapped.preExistingConditions =
      row['preExistingConditions'] ||
      row['pre_existing_conditions'] ||
      row['medical_conditions'] ||
      row['conditions'] ||
      row['condiciones_preexistentes'] ||
      row['condiciones'] ||
      row['Condiciones'] ||
      row['condicoes_preexistentes'] ||
      row['condições_preexistentes'] ||
      row['condições'] ||
      null;

    // Limpiar valores vacíos (convertir strings vacíos a null)
    Object.keys(mapped).forEach((key) => {
      if (mapped[key] === '' || mapped[key] === undefined) {
        mapped[key] = null;
      }
    });

    return mapped;
  }

  /**
   * Valida los datos del paciente antes de crear
   */
  private async validatePatientData(data: any, clinicaId: string): Promise<string | null> {
    // 1. Nombre es obligatorio
    if (!data.name || data.name.trim() === '') {
      return 'El campo "name" (nombre) es obligatorio';
    }

    // 2. Nombre debe tener al menos 2 caracteres
    if (data.name.length < 2) {
      return 'El nombre debe tener al menos 2 caracteres';
    }

    // 3. Validar email si existe
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return `Email inválido: ${data.email}`;
      }
    }

    // 4. Validar fecha de nacimiento si existe
    if (data.birthDate) {
      const date = new Date(data.birthDate);
      if (isNaN(date.getTime())) {
        return 'Fecha de nacimiento inválida';
      }
      // Validar que no sea fecha futura
      if (date > new Date()) {
        return 'La fecha de nacimiento no puede ser futura';
      }
      // Validar que sea razonable (no más de 150 años atrás)
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 150);
      if (date < minDate) {
        return 'La fecha de nacimiento no es válida (muy antigua)';
      }
    }

    // 5. Validar género si existe
    if (data.gender && !['Masculino', 'Femenino', 'Otro'].includes(data.gender)) {
      return `Género inválido: ${data.gender}. Debe ser: Masculino, Femenino u Otro`;
    }

    return null; // Sin errores
  }

  /**
   * Verifica si existe un paciente duplicado
   */
  private async checkDuplicate(
    data: any,
    clinicaId: string,
    duplicateField: 'email' | 'documento' | 'both',
  ): Promise<boolean> {
    const whereCondition: any = { clinicaId };

    if (duplicateField === 'email' && data.email) {
      whereCondition.email = data.email;
    } else if (duplicateField === 'documento' && data.documento) {
      whereCondition.documento = data.documento;
    } else if (duplicateField === 'both') {
      if (!data.email && !data.documento) {
        return false; // Sin datos para verificar duplicados
      }
      whereCondition.OR = [];
      if (data.email) {
        whereCondition.OR.push({ email: data.email });
      }
      if (data.documento) {
        whereCondition.OR.push({ documento: data.documento });
      }
    } else {
      return false; // Sin campo para verificar
    }

    const existing = await this.prisma.patient.findFirst({ where: whereCondition });
    return !!existing;
  }

  /**
   * Sincroniza el contacto con el sistema de mensajería
   * Por ahora solo registra que el paciente está listo para mensajería
   */
  private async syncContact(patient: any, clinicaId: string): Promise<void> {
    try {
      // El paciente ya está creado en la BD y listo para mensajería
      // Cuando se envíe el primer mensaje, se creará la conversación automáticamente
      if (patient.email || patient.phone) {
        this.logger.debug(`Paciente ${patient.id} listo para mensajería`);
      }
    } catch (error) {
      // No fallar la importación si falla la sincronización
      this.logger.warn(`No se pudo sincronizar contacto: ${error.message}`);
    }
  }

  /**
   * Parsea fechas en múltiples formatos
   */
  private parseFlexibleDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const trimmed = dateStr.toString().trim();

    // ISO: 1990-05-15
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return new Date(trimmed);
    }

    // Formato DD/MM/YYYY (Argentina, Chile, etc.)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split('/');
      return new Date(`${year}-${month}-${day}`);
    }

    // Formato MM/DD/YYYY (USA)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [month, day, year] = trimmed.split('/');
      // Intentar detectar si es MM/DD o DD/MM basándose en valores
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      
      if (monthNum > 12) {
        // Es DD/MM
        return new Date(`${year}-${day}-${month}`);
      } else if (dayNum > 12) {
        // Es MM/DD
        return new Date(`${year}-${month}-${day}`);
      } else {
        // Ambiguo, asumir DD/MM (formato latinoamericano por defecto)
        return new Date(`${year}-${month}-${day}`);
      }
    }

    // Formato YYYY/MM/DD
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('/');
      return new Date(`${year}-${month}-${day}`);
    }

    return null;
  }

  /**
   * Normaliza el género a los valores aceptados
   * Soporta: Español, Portugués, Inglés
   */
  private normalizeGender(value: string): string | null {
    if (!value) return null;

    const normalized = value.toLowerCase().trim();

    // MASCULINO
    // Español: masculino, m, hombre, h
    // Portugués: masculino, m, homem, h
    // Inglés: male, m, man
    if (['masculino', 'm', 'male', 'man', 'hombre', 'h', 'homem'].includes(normalized)) {
      return 'Masculino';
    }
    
    // FEMENINO
    // Español: femenino, f, mujer
    // Portugués: feminino, f, mulher
    // Inglés: female, f, woman
    if (['femenino', 'feminino', 'f', 'female', 'woman', 'mujer', 'mulher'].includes(normalized)) {
      return 'Femenino';
    }
    
    // OTRO
    // Español: otro, no binario
    // Portugués: outro, não binário
    // Inglés: other, non-binary, non binary
    if (['otro', 'outro', 'other', 'no binario', 'não binário', 'non-binary', 'non binary', 'x', 'nb'].includes(normalized)) {
      return 'Otro';
    }

    return null;
  }

  /**
   * Escapa valores para CSV
   */
  private escapeCsvValue(value: string): string {
    if (!value) return '';
    
    const stringValue = value.toString();
    
    // Si contiene coma, comillas o salto de línea, envolver en comillas
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  /**
   * Construye el mensaje de resultado
   */
  private buildResultMessage(result: ImportResultDto, isDryRun: boolean): string {
    if (isDryRun) {
      return `Validación completada: ${result.exitosos} filas válidas, ${result.errores} errores, ${result.duplicados} duplicados detectados (sin importar)`;
    }

    if (result.errores === 0 && result.duplicados === 0) {
      return `✅ Importación exitosa: ${result.exitosos} pacientes creados`;
    }

    if (result.exitosos === 0) {
      return `❌ Importación fallida: ${result.errores} errores encontrados`;
    }

    return `⚠️ Importación parcial: ${result.exitosos} pacientes creados, ${result.errores} errores, ${result.duplicados} duplicados omitidos`;
  }
}

