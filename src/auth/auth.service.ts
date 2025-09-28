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
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async loginWithDto(dto: LoginAuthDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    console.log('🔍 Usuario encontrado en login:', {
      id: user.id,
      email: user.email,
      role: user.role,
      clinicaId: user.clinicaId
    });
    
    // Obtener información de la clínica si el usuario tiene una
    let clinicaUrl: string | null = null;
    if (user.clinicaId) {
      console.log('🔍 Usuario tiene clinicaId, buscando clínica...');
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: user.clinicaId },
        select: { url: true }
      });
      clinicaUrl = clinica?.url || null;
      console.log('🔍 Clínica encontrada:', { clinicaUrl });
    } else {
      console.log('🔍 Usuario no tiene clinicaId');
    }
    
    // Crear objeto de usuario con información de clínica
    const userWithClinica = {
      ...user,
      clinicaUrl
    };
    
    console.log('🔍 Usuario con clínica:', {
      id: userWithClinica.id,
      email: userWithClinica.email,
      role: userWithClinica.role,
      clinicaId: userWithClinica.clinicaId,
      clinicaUrl: userWithClinica.clinicaUrl
    });
    
    return this.login(userWithClinica);
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      clinicaId: user.clinicaId,
      clinicaUrl: user.clinicaUrl
    };
    return { access_token: this.jwtService.sign(payload) };
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
      
      if (dto.clinicaId) {
        console.log('🔍 Buscando usuario en clínica específica...');
        // Si hay clínica, verificar solo en esa clínica
        const existingUser = await this.prisma.user.findFirst({
          where: { 
            email: dto.email, 
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
            email: dto.email, 
            clinicaId: null 
          },
        });

        if (existingUser) {
          console.log('❌ Error: Email ya registrado globalmente');
          throw new BadRequestException('El email ya está registrado');
        }
        console.log('✅ Email disponible globalmente');
      }

      console.log('🔐 Generando hash de contraseña...');
      const hashed = await bcrypt.hash(dto.password, 10);
      console.log('✅ Hash de contraseña generado');
      
      // Generar username automáticamente
      console.log(`👤 Generando username para: ${dto.name}`);
      const username = PasswordGenerator.generateUsername(dto.name);
      console.log(`✅ Username generado: ${username}`);
      
      console.log('💾 Creando usuario en base de datos local...');
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: username,
          password: hashed,
          name: dto.name,
          role: role as any,
          clinicaId: dto.clinicaId || null,
        },
      });
      console.log('✅ Usuario creado en BD local:', {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        clinicaId: user.clinicaId
      });

      // Hacer POST a la API externa de Fluentia
      console.log('🌐 ===== INICIANDO LLAMADA A API EXTERNA =====');
      const startTime = Date.now();
      try {
        const externalApiUrl = 'https://fluentia-api-develop-latest.up.railway.app/auth/register';
        const externalApiData = {
          name: username, // Usar el username generado
          email: dto.email,
          password: dto.password, // Contraseña en texto plano
        };
        
        console.log('📤 Datos que se enviarán a la API externa:', JSON.stringify(externalApiData, null, 2));
        console.log('🔗 URL de la API externa:', externalApiUrl);
        console.log('⏱️ Iniciando petición HTTP...');
        const externalApiResponse = await axios.post(externalApiUrl, externalApiData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 segundos de timeout
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('✅ ===== LLAMADA A API EXTERNA EXITOSA =====');
        console.log('⏱️ Duración de la petición:', `${duration}ms`);
        console.log('📊 Status Code:', externalApiResponse.status);
        console.log('📋 Headers de respuesta:', JSON.stringify(externalApiResponse.headers, null, 2));
        console.log('📄 Datos de respuesta:', JSON.stringify(externalApiResponse.data, null, 2));
        console.log('✅ Usuario registrado exitosamente en Fluentia API');
        
      } catch (externalApiError) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('❌ ===== ERROR EN LLAMADA A API EXTERNA =====');
        console.log('⏱️ Duración antes del error:', `${duration}ms`);
        console.log('🚨 Tipo de error:', externalApiError.name || 'Unknown');
        console.log('📝 Mensaje de error:', externalApiError.message);
        
        if (externalApiError.response) {
          console.log('📊 Status Code de error:', externalApiError.response.status);
          console.log('📋 Headers de error:', JSON.stringify(externalApiError.response.headers, null, 2));
          console.log('📄 Datos de error:', JSON.stringify(externalApiError.response.data, null, 2));
        } else if (externalApiError.request) {
          console.log('🔌 Error de conexión - No se recibió respuesta');
          console.log('📋 Request config:', JSON.stringify(externalApiError.config, null, 2));
        } else {
          console.log('⚙️ Error de configuración:', externalApiError.message);
        }
        
        console.log('⚠️ IMPORTANTE: El registro local continúa normalmente');
        console.log('⚠️ El usuario se registra en el sistema local aunque falle la API externa');
      }

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
      const loginResult = this.login(user);
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

      // Buscar usuario por username (que será el email para owners)
      const user = await this.prisma.user.findFirst({
        where: { email: dto.username },
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

      // Buscar usuario por email y clínica
      const user = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
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
          permisos: this.getPermisosByRole(user.role),
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
      const user = await this.prisma.user.findFirst({
          where: { email: dto.email },
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
      const user = await this.prisma.user.findFirst({
          where: { email: resetToken.email },
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
      const user = await this.prisma.user.findFirst({
          where: { email: dto.email },
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
    const user = await this.prisma.user.findFirst({
      where: { 
        email,
        clinicaId: clinicaId || null
      },
    });
    return { available: !user };
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
