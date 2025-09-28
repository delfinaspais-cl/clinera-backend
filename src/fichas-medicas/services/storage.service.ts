import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly uploadDir = 'uploads';
  private readonly fichasMedicasDir = 'fichas-medicas';

  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = [
      this.uploadDir,
      path.join(this.uploadDir, this.fichasMedicasDir),
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    clinicaId: string,
    pacienteId: string,
    tipo: 'archivos' | 'imagenes'
  ): Promise<{ url: string; nombreArchivo: string }> {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const nombreArchivo = `${timestamp}-${uuidv4()}${extension}`;
    
    const relativePath = path.join(
      this.fichasMedicasDir,
      clinicaId,
      pacienteId,
      tipo
    );
    
    const fullPath = path.join(this.uploadDir, relativePath);
    
    // Crear directorios si no existen
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    const filePath = path.join(fullPath, nombreArchivo);
    
    // Guardar archivo
    console.log('💾 [STORAGE] Guardando archivo:', {
      targetPath: filePath,
      hasBuffer: !!file.buffer,
      bufferLength: file.buffer?.length,
      fileSize: file.size,
      originalName: file.originalname,
      sourcePath: file.path
    });
    
    if (file.buffer) {
      // Usar buffer si está disponible
      fs.writeFileSync(filePath, file.buffer);
      console.log('✅ [STORAGE] Archivo guardado usando buffer');
    } else if (file.path) {
      // Si no hay buffer pero hay path, copiar el archivo
      fs.copyFileSync(file.path, filePath);
      console.log('✅ [STORAGE] Archivo copiado desde path');
    } else {
      console.error('❌ [STORAGE] No hay buffer ni path disponible');
      throw new Error('Buffer del archivo no disponible');
    }
    
    // Retornar URL relativa
    const url = `/${relativePath}/${nombreArchivo}`;
    
    return {
      url,
      nombreArchivo
    };
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error eliminando archivo:', error);
    }
  }

  getFileUrl(url: string): string {
    // Si la URL ya es una URL completa (S3), devolverla tal como está
    if (url.startsWith('https://') || url.startsWith('http://')) {
      console.log('🌐 [STORAGE] URL completa detectada (S3):', url);
      return url;
    }
    
    // Si es una URL relativa, generar URL del servidor deployado
    const baseUrl = process.env.API_BASE_URL || 'https://clinera-backend-production.up.railway.app';
    // Remover el / del inicio de la URL si existe
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    const deployedUrl = `${baseUrl}/api/public/files/${cleanUrl}`;
    console.log('🌐 [STORAGE] URL del servidor deployado generada:', deployedUrl);
    return deployedUrl;
  }
}


