import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { OwnerLoginDto } from './dto/owner-login.dto';
import { ClinicaLoginDto } from './dto/clinica-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailService } from '../email/email.service';
import { PasswordGenerator } from '../common/utils/password-generator';
import { randomBytes } from 'crypto';
import axios from 'axios';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    // Normalizar email a minúsculas para búsqueda case-insensitive
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findFirst({ 
      where: { 
        OR: [
          { email: normalizedEmail },
          { username: normalizedEmail }
        ]
      } 
    });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async loginWithDto(dto: LoginAuthDto) {
    console.log('🔥 SERVICE LOGIN - VERSIÓN SIMPLIFICADA');
    console.log('🚀 ===== INICIO DE LOGIN =====');
    console.log('📋 Datos recibidos:', dto);
    
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      console.log('❌ Usuario no encontrado o credenciales inválidas');
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    console.log('✅ Usuario encontrado en login:', { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      preferredLanguage: user.preferredLanguage 
    });
    
    // Obtener información de la clínica si el usuario tiene una
    let clinicaUrl: string | null = null;
    if (user.clinicaId) {
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: user.clinicaId },
        select: { url: true }
      });
      clinicaUrl = clinica?.url || null;
    }
    
    // Generar token JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      clinicaId: user.clinicaId,
      clinicaUrl: clinicaUrl
    };

    const token = this.jwtService.sign(payload);
    
    console.log('✅ Token JWT generado exitosamente');
    
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clinicaId: user.clinicaId,
        clinicaUrl: clinicaUrl,
        preferredLanguage: user.preferredLanguage
      }
    };
  }

  async login(user: any) {
    console.log('🔥🔥🔥 MÉTODO LOGIN ACTUALIZADO - VERSIÓN NUEVA 🔥🔥🔥');
    console.log('🔍 Datos del usuario en método login:', {
      id: user.id,
      email: user.email,
      preferredLanguage: user.preferredLanguage,
      role: user.role
    });

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      clinicaId: user.clinicaId,
      clinicaUrl: user.clinicaUrl
    };
    
    const response = { 
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clinicaId: user.clinicaId,
        clinicaUrl: user.clinicaUrl,
        preferredLanguage: user.preferredLanguage || 'es'
      }
    };
    
    console.log('📋 Respuesta del login:', JSON.stringify(response, null, 2));
    return response;
  }

  async register(dto: RegisterAuthDto) {
    try {
      // Debug: Log de los datos recibidos
      console.log('🚀 ===== INICIO DE REGISTRO =====');
      console.log('📋 Datos recibidos en registro:', JSON.stringify(dto, null, 2));
      console.log('⏰ Timestamp:', new Date().toISOString());

      // Validar que el campo role existe
      if (!dto.role) {
        console.log('❌ Error: Campo role faltante');
        throw new BadRequestException('El campo "role" es requerido');
      }

      const role = dto.role.toUpperCase(); // normaliza
      console.log(`🔍 Rol normalizado: "${role}"`);
      
      if (!['ADMIN', 'PROFESSIONAL', 'PATIENT', 'OWNER'].includes(role)) {
        console.log(`❌ Error: Rol inválido "${dto.role}"`);
        throw new BadRequestException(
          `Rol inválido: "${dto.role}". Roles válidos: PATIENT, PROFESSIONAL, ADMIN, OWNER`,
        );
      }
      
      console.log('✅ Rol válido confirmado');

      // Verificar si el email ya existe en la misma clínica
      console.log(`🔍 Verificando email existente: ${dto.email}`);
      console.log(`🏥 ClinicaId: ${dto.clinicaId || 'null'}`);
      
      // Normalizar email para búsqueda case-insensitive
      const normalizedEmail = dto.email.toLowerCase();
      
      if (dto.clinicaId) {
        console.log('🔍 Buscando usuario en clínica específica...');
        // Si hay clínica, verificar solo en esa clínica
        const existingUser = await this.prisma.user.findFirst({
          where: { 
            email: normalizedEmail,
            clinicaId: dto.clinicaId 
          },
        });

        if (existingUser) {
          console.log('❌ Error: Email ya registrado en esta clínica');
          throw new BadRequestException('El email ya está registrado en esta clínica');
        }
        console.log('✅ Email disponible en esta clínica');
      } else {
        console.log('🔍 Buscando usuario globalmente...');
        // Si no hay clínica, verificar si existe globalmente
        const existingUser = await this.prisma.user.findFirst({
          where: { 
            email: normalizedEmail,
            clinicaId: null 
          },
        });

        if (existingUser) {
          console.log('❌ Error: Email ya registrado globalmente');
          throw new BadRequestException('El email ya está registrado');
        }
        console.log('✅ Email disponible globalmente');
      }

      const hashed = await bcrypt.hash(dto.password, 10);
      
      // Generar username automáticamente
      const username = PasswordGenerator.generateUsername(dto.name);
      // Normalizar username a minúsculas para almacenamiento consistente
      const normalizedUsername = username.toLowerCase();
      
      console.log('💾 Creando usuario en la base de datos...');
      // Usar el email y username ya normalizados para almacenamiento consistente
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          username: normalizedUsername,
          password: hashed,
          name: dto.name,
          role: role as any,
          clinicaId: dto.clinicaId || null,
          preferredLanguage: dto.preferredLanguage || 'es', // Default a español si no se proporciona
        },
      });
      console.log('✅ Usuario creado exitosamente:', {
        id: user.id,
        email: user.email,
        preferredLanguage: user.preferredLanguage
      });

      // Hacer POST a la API externa de Fluentia
      const startTime = Date.now();
      try {
        const externalApiUrl = 'https://fluentia-api-develop-latest.up.railway.app/auth/register';
        const externalApiData = {
          name: username, // Usar el username generado
          email: dto.email,
          password: dto.password, // Contraseña en texto plano
        };
        console.log('⏱️ Iniciando petición HTTP...');
        await axios.post(externalApiUrl, externalApiData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 segundos de timeout
        });
        
        console.log('✅ Usuario registrado en Fluentia API');
        
      } catch (externalApiError) {
        console.log('❌ Error en Fluentia API:', externalApiError.response?.data?.message || externalApiError.message);
        console.log('⚠️ Registro local continúa normalmente');
      }
      
      console.log('✅ API externa procesada, continuando con el registro local...');

      // Enviar email de bienvenida con credenciales (solo si tiene clínica)
      // TEMPORALMENTE COMENTADO PARA DEBUG
      /*
      if (user.clinicaId) {
        try {
          const clinica = await this.prisma.clinica.findUnique({
            where: { id: user.clinicaId },
          });
          
          await this.emailService.sendWelcomeCredentialsEmail(
            dto.email,
            dto.password, // Contraseña en texto plano para el email
            dto.name,
            dto.role,
            clinica?.name,
          );
          console.log(`Email de bienvenida enviado a ${dto.email}`);
        } catch (emailError) {
          console.error('Error al enviar email de bienvenida:', emailError);
          // No lanzamos error para no interrumpir el registro
        } 
      }
      */

      console.log('🔑 Generando token de acceso...');
      const loginResult = await this.login(user);
      console.log('✅ Token generado exitosamente');
      console.log('🎉 ===== REGISTRO COMPLETADO EXITOSAMENTE =====');
      console.log('📊 Resumen del registro:');
      console.log('   - Usuario creado localmente: ✅');
      console.log('   - API externa llamada: ✅ (ver logs anteriores para detalles)');
      console.log('   - Token generado: ✅');
      console.log('==========================================');
      
      return loginResult;
    } catch (error) {
      console.log('💥 ===== ERROR EN PROCESO DE REGISTRO =====');
      console.log('🚨 Error capturado:', error.message);
      console.log('📊 Stack trace:', error.stack);
      
      if (error instanceof BadRequestException) {
        console.log('⚠️ Error de validación - re-lanzando');
        throw error;
      }
      console.error('❌ Error interno en registro:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async ownerLogin(dto: OwnerLoginDto) {
    try {
      console.log('Owner login DTO:', dto); // Debug log

      // Buscar usuario por email o username
      // Normalizar a minúsculas para búsqueda case-insensitive
      const normalizedEmailOrUsername = dto.username.toLowerCase();
      const user = await this.prisma.user.findFirst({
        where: { 
          OR: [
            { email: normalizedEmailOrUsername },
            { username: normalizedEmailOrUsername }
          ]
        },
      });

      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Verificar que sea un OWNER
      if (user.role !== 'OWNER') {
        throw new UnauthorizedException(
          'Acceso denegado. Solo propietarios pueden acceder.',
        );
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(dto.password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Generar token
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      const token = this.jwtService.sign(payload);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error en owner login:', error);
      throw new UnauthorizedException('Error interno del servidor');
    }
  }

  async ownerLogout(token: string) {
    // En una implementación real, aquí podrías invalidar el token
    // Por ahora, solo retornamos éxito
    return { success: true };
  }

  async clinicaLogin(dto: ClinicaLoginDto) {
    try {
      // Buscar la clínica por URL
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: dto.clinicaUrl },
      });

      if (!clinica) {
        throw new UnauthorizedException('Clínica no encontrada');
      }

      // Verificar si la clínica está pendiente de aprobación
      if (clinica.pendienteAprobacion) {
        throw new BadRequestException('La clínica está pendiente de aprobación. Contacta al administrador del sistema.');
      }

      // Verificar si la clínica está inactiva
      if (clinica.estado === 'inactiva') {
        throw new BadRequestException('La clínica está inactiva. Contacta al administrador del sistema.');
      }

      // Buscar usuario por email o username y clínica
      // Normalizar a minúsculas para búsqueda case-insensitive
      const normalizedEmailOrUsername = dto.email.toLowerCase();
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmailOrUsername },
            { username: normalizedEmailOrUsername }
          ],
          clinicaId: clinica.id,
        },
        include: {
          clinica: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(dto.password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Generar token
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        clinicaId: user.clinicaId,
        clinicaUrl: clinica.url,
      };

      const token = this.jwtService.sign(payload);

      // Obtener permisos desde la base de datos (campo permisos)
      // Si no tiene permisos asignados, usar permisos por defecto según rol (fallback)
      let permisos = user.permisos || this.getPermisosByRole(user.role);

      return {
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          clinicaId: user.clinicaId,
          clinicaUrl: clinica.url,
          permisos: permisos,
        },
        clinica: {
          id: clinica.id,
          nombre: clinica.name,
          url: clinica.url,
          plan: clinica.estadoPago === 'pagado' ? 'professional' : 'basic',
          estado: clinica.estado,
          colorPrimario: clinica.colorPrimario,
          colorSecundario: clinica.colorSecundario,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error en clínica login:', error);
      throw new UnauthorizedException('Error interno del servidor');
    }
  }

  async clinicaLogout(token: string) {
    // En una implementación real, aquí podrías invalidar el token
    // Por ahora, solo retornamos éxito
    return { success: true };
  }

  // Métodos de recuperación de contraseña
  async forgotPassword(dto: ForgotPasswordDto) {
    try {
      // Buscar usuario por email
      // Normalizar email a minúsculas para búsqueda case-insensitive
      const normalizedEmail = dto.email.toLowerCase();
      const user = await this.prisma.user.findFirst({
          where: { 
            email: normalizedEmail
          },
      });

      if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        return {
          success: true,
          message:
            'Si el email está registrado, recibirás un enlace para restablecer tu contraseña',
        };
      }

      // Generar token único
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Guardar token en base de datos
      await this.prisma.passwordResetToken.create({
        data: {
          email: dto.email,
          token: resetToken,
          expiresAt,
          used: false,
        },
      });

      // Enviar email
      const emailSent = await this.emailService.sendPasswordResetEmail(
        dto.email,
        resetToken,
        user.name || 'Usuario',
      );

      if (!emailSent) {
        throw new BadRequestException(
          'Error al enviar el email de recuperación',
        );
      }

      return {
        success: true,
        message:
          'Si el email está registrado, recibirás un enlace para restablecer tu contraseña',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error en forgotPassword:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      // Buscar token válido
      const resetToken = await this.prisma.passwordResetToken.findFirst({
        where: {
          token: dto.token,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!resetToken) {
        throw new BadRequestException('Token inválido o expirado');
      }

      // Buscar usuario
      // Normalizar email a minúsculas para búsqueda case-insensitive
      const normalizedEmail = resetToken.email.toLowerCase();
      const user = await this.prisma.user.findFirst({
          where: { 
            email: normalizedEmail
          },
      });

      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Actualizar contraseña
      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Marcar token como usado
      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });

      // Enviar email de confirmación
      await this.emailService.sendPasswordChangedEmail(
        user.email,
        user.name || 'Usuario',
      );

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error en resetPassword:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async changePassword(dto: ChangePasswordDto) {
    try {
      // Buscar usuario por email
      // Normalizar email a minúsculas para búsqueda case-insensitive
      const normalizedEmail = dto.email.toLowerCase();
      const user = await this.prisma.user.findFirst({
          where: { 
            email: normalizedEmail
          },
      });

      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        throw new BadRequestException('La contraseña actual es incorrecta');
      }

      // Verificar que la nueva contraseña sea diferente
      const isSamePassword = await bcrypt.compare(
        dto.newPassword,
        user.password,
      );

      if (isSamePassword) {
        throw new BadRequestException(
          'La nueva contraseña debe ser diferente a la actual',
        );
      }

      // Actualizar contraseña
      const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      // Enviar email de confirmación
      await this.emailService.sendPasswordChangedEmail(
        user.email,
        user.name || 'Usuario',
      );

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error en changePassword:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async validateResetToken(token: string) {
    try {
      const resetToken = await this.prisma.passwordResetToken.findFirst({
        where: {
          token,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return {
        valid: !!resetToken,
        message: resetToken ? 'Token válido' : 'Token inválido o expirado',
      };
    } catch (error) {
      console.error('Error al validar token:', error);
      return {
        valid: false,
        message: 'Error al validar token',
      };
    }
  }

  async validateEmail(email: string, clinicaId?: string) {
    try {
      // Normalizar email a minúsculas
      const normalizedEmail = email.toLowerCase().trim();
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return {
          success: true,
          available: false,
          message: 'El formato del email no es válido',
        };
      }

      // Buscar usuario con ese email
      const user = await this.prisma.user.findFirst({
        where: { 
          email: normalizedEmail,
          clinicaId: clinicaId || undefined
        },
      });
      
      return {
        success: true,
        available: !user,
        message: user ? 'El email ya está registrado' : 'El email está disponible',
      };
    } catch (error) {
      console.error('Error validando email:', error);
      throw new BadRequestException('Error al validar email');
    }
  }

  async validateUsername(username: string, clinicaId?: string) {
    try {
      // Normalizar username a minúsculas
      const normalizedUsername = username.toLowerCase().trim();
      
      // Validar formato de username (letras, números, guiones, guiones bajos)
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(normalizedUsername)) {
        return {
          success: true,
          available: false,
          message: 'El username solo puede contener letras, números, guiones y guiones bajos',
        };
      }

      // Validar longitud mínima
      if (normalizedUsername.length < 3) {
        return {
          success: true,
          available: false,
          message: 'El username debe tener al menos 3 caracteres',
        };
      }

      // Buscar usuario con ese username
      const user = await this.prisma.user.findFirst({
        where: { 
          username: normalizedUsername,
          clinicaId: clinicaId || undefined
        },
      });
      
      return {
        success: true,
        available: !user,
        message: user ? 'El username ya está en uso' : 'El username está disponible',
      };
    } catch (error) {
      console.error('Error validando username:', error);
      throw new BadRequestException('Error al validar username');
    }
  }

  async createOwnerForRailway() {
    try {
      // Verificar si ya existe un OWNER para Railway
      const existingOwner = await this.prisma.user.findFirst({
        where: {
          email: 'railway-owner@clinera.io',
          role: 'OWNER',
        },
      });

      if (existingOwner) {
        return {
          success: true,
          message: 'OWNER para Railway ya existe',
          credentials: {
            email: 'railway-owner@clinera.io',
            password: '123456',
          },
        };
      }

      // Crear nuevo OWNER para Railway
      const hashedPassword = await bcrypt.hash('123456', 10);
      const owner = await this.prisma.user.create({
        data: {
          email: 'railway-owner@clinera.io',
          password: hashedPassword,
          name: 'Railway Owner',
          role: 'OWNER',
          clinicaId: null, // Los OWNER no tienen clínica específica
          estado: 'activo',
        },
      });

      return {
        success: true,
        message: 'OWNER creado exitosamente para Railway',
        credentials: {
          email: 'railway-owner@clinera.io',
          password: '123456',
        },
        user: {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          role: owner.role,
        },
      };
    } catch (error) {
      console.error('Error creando OWNER para Railway:', error);
      throw new BadRequestException('Error creando usuario OWNER');
    }
  }

  private getPermisosByRole(role: string): string[] {
    switch (role) {
      case 'ADMIN':
        return ['turnos', 'usuarios', 'configuracion', 'reportes', 'notificaciones', 'ventas', 'pacientes', 'tratamientos', 'profesionales'];
      case 'PROFESSIONAL':
        return ['turnos', 'pacientes', 'reportes'];
      case 'SECRETARY':
        return ['turnos', 'pacientes', 'notificaciones'];
      case 'OWNER':
        return ['turnos', 'usuarios', 'configuracion', 'reportes', 'notificaciones', 'planes', 'facturacion', 'ventas', 'pacientes', 'tratamientos'];
      default:
        return [];
    }
  }

  // Métodos de verificación de email
  async sendVerificationCode(email: string, ipAddress?: string, userAgent?: string) {
    try {
      console.log(`📧 AuthService: Iniciando envío de código de verificación a ${email}`);

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestException('Formato de email inválido');
      }

      // Verificar límites de envío (máximo 3 por hora por email/IP)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentAttempts = await this.prisma.emailVerificationLimit.findMany({
        where: {
          OR: [
            { email: email },
            { ipAddress: ipAddress || 'unknown' }
          ],
          lastAttempt: {
            gt: oneHourAgo
          }
        }
      });

      const totalAttempts = recentAttempts.reduce((sum, attempt) => sum + attempt.attempts, 0);
      
      if (totalAttempts >= 3) {
        throw new BadRequestException('Demasiados intentos. Intenta nuevamente en 1 hora');
      }

      // Generar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`📧 AuthService: Código generado: ${code}`);

      // Guardar en base de datos
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
      
      await this.prisma.emailVerification.create({
        data: {
          email,
          code,
          expiresAt,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown'
        }
      });

      // Enviar email
      const emailSent = await this.emailService.sendVerificationEmail(email, code);
      
      if (!emailSent) {
        throw new BadRequestException('Error al enviar el email de verificación');
      }

      // Registrar intento
      await this.prisma.emailVerificationLimit.upsert({
        where: {
          email_ipAddress: {
            email: email,
            ipAddress: ipAddress || 'unknown'
          }
        },
        update: {
          attempts: { increment: 1 },
          lastAttempt: new Date()
        },
        create: {
          email,
          ipAddress: ipAddress || 'unknown',
          attempts: 1,
          lastAttempt: new Date()
        }
      });

      console.log(`✅ AuthService: Código de verificación enviado exitosamente a ${email}`);
      
      return {
        success: true,
        message: 'Código de verificación enviado exitosamente',
        email: email
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ AuthService: Error en sendVerificationCode:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async verifyCode(email: string, code: string) {
    try {
      console.log(`🔍 AuthService: Verificando código para ${email}`);

      // Buscar código en BD
      const verification = await this.prisma.emailVerification.findFirst({
        where: {
          email: email,
          code: code,
          verified: false
        }
      });

      if (!verification) {
        throw new BadRequestException('Código de verificación incorrecto');
      }

      // Verificar expiración
      if (new Date() > verification.expiresAt) {
        // Eliminar código expirado
        await this.prisma.emailVerification.delete({
          where: { id: verification.id }
        });
        throw new BadRequestException('El código de verificación ha expirado');
      }

      // Marcar como verificado
      await this.prisma.emailVerification.update({
        where: { id: verification.id },
        data: {
          verified: true,
          verifiedAt: new Date()
        }
      });

      // Limpiar códigos expirados del mismo email
      await this.prisma.emailVerification.deleteMany({
        where: {
          email: email,
          verified: false,
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`✅ AuthService: Email ${email} verificado exitosamente`);
      
      return {
        success: true,
        message: 'Email verificado exitosamente',
        verified: true,
        email: email
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ AuthService: Error en verifyCode:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async isEmailVerified(email: string): Promise<boolean> {
    try {
      const verification = await this.prisma.emailVerification.findFirst({
        where: {
          email: email,
          verified: true
        },
        orderBy: {
          verifiedAt: 'desc'
        }
      });

      return !!verification;
    } catch (error) {
      console.error('❌ AuthService: Error verificando estado de email:', error);
      return false;
    }
  }
}
