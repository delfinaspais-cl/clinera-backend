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
    let clinicaUrl = null;
    if (user.clinicaId) {
      console.log('🔍 Usuario tiene clinicaId, buscando clínica...');
      const clinica = await this.prisma.clinica.findUnique({
        where: { id: user.clinicaId },
        select: { url: true }
      });
      clinicaUrl = clinica?.url;
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
      console.log('Datos recibidos en registro:', JSON.stringify(dto, null, 2));

      // Validar que el campo role existe
      if (!dto.role) {
        throw new BadRequestException('El campo "role" es requerido');
      }

      const role = dto.role.toUpperCase(); // normaliza
      if (!['ADMIN', 'PROFESSIONAL', 'PATIENT', 'OWNER'].includes(role)) {
        throw new BadRequestException(
          `Rol inválido: "${dto.role}". Roles válidos: PATIENT, PROFESSIONAL, ADMIN, OWNER`,
        );
      }

      // Verificar si el email ya existe en la misma clínica
      if (dto.clinicaId) {
        // Si hay clínica, verificar solo en esa clínica
        const existingUser = await this.prisma.user.findFirst({
          where: { 
            email: dto.email, 
            clinicaId: dto.clinicaId 
          },
        });

        if (existingUser) {
          throw new BadRequestException('El email ya está registrado en esta clínica');
        }
      } else {
        // Si no hay clínica, verificar si existe globalmente
        const existingUser = await this.prisma.user.findFirst({
          where: { 
            email: dto.email, 
            clinicaId: null 
          },
        });

        if (existingUser) {
          throw new BadRequestException('El email ya está registrado');
        }
      }

      const hashed = await bcrypt.hash(dto.password, 10);
      
      // Generar username automáticamente
      const username = PasswordGenerator.generateUsername(dto.name);
      
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

      return this.login(user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error en registro:', error);
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
}
