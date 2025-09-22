import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRegisterDto } from '../auth/dto/user-register.dto';
import { UserLoginDto } from '../auth/dto/user-login.dto';
import { CreateClinicaDto } from '../owners/dto/create-clinica.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(dto: UserRegisterDto) {
    try {
      console.log('🔍 Iniciando registro de usuario:', dto.email);
      
      // Verificar si el email ya existe
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: dto.email },
      });

      if (existingEmail) {
        console.log('❌ Email ya existe:', dto.email);
        throw new ConflictException('El email ya está registrado');
      }

      // Verificar si el username ya existe
      const existingUsername = await this.prisma.user.findFirst({
        where: { username: dto.username },
      });

      if (existingUsername) {
        console.log('❌ Username ya existe:', dto.username);
        throw new ConflictException('El nombre de usuario ya está en uso');
      }

      console.log('✅ Validaciones pasadas, creando usuario...');

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Crear el usuario con username
    const user = await this.prisma.user.create({
      data: {
          email: dto.email,
          username: dto.username,
        password: hashedPassword,
          name: dto.name,
                  role: 'ADMIN',
          clinicaId: null,
      },
    });
      console.log('✅ Usuario creado exitosamente con username');

      // Generar token JWT
      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        name: user.name,
      };

      const token = this.jwtService.sign(payload);

    // Enviar email de bienvenida con credenciales
      try {
        await this.emailService.sendWelcomeEmail(
          dto.email,
          dto.name,
          dto.username,
          dto.password, // Pasar la contraseña en texto plano para el email
        );
    } catch (emailError) {
        console.error('Error al enviar email de bienvenida:', emailError);
        // No lanzamos error para no interrumpir el registro
    }

    return {
        success: true,
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Error en registro de usuario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async login(dto: UserLoginDto) {
    try {
      // Buscar usuario por username o email con información de la clínica
      const user = await this.prisma.user.findFirst({
        where: { 
          OR: [
            { username: dto.username },
            { email: dto.username },
          ],
        },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
              estado: true,
              estadoPago: true,
              createdAt: true,
              colorPrimario: true,
              colorSecundario: true,
            }
          }
        }
      });
      
      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(dto.password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Generar token JWT
      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        name: user.name,
      };

      const token = this.jwtService.sign(payload);

      return {
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          role: user.role,
          clinica: user.clinica, // Incluir información de la clínica
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error en login de usuario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          clinica: {
            select: {
              id: true,
              name: true,
              url: true,
              estado: true,
              estadoPago: true,
              createdAt: true,
              colorPrimario: true,
              colorSecundario: true,
            }
          }
        }
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          phone: user.phone,
          role: user.role,
          estado: user.estado,
          createdAt: user.createdAt,
          avatar_url: user.avatar_url,
          clinica: user.clinica, // Incluir información de la clínica
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error al obtener perfil:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async getUserClinicas(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          clinicasAdministradas: {
      select: {
        id: true,
        name: true,
              url: true,
        estado: true,
              estadoPago: true,
        createdAt: true,
              colorPrimario: true,
              colorSecundario: true,
            },
          },
      },
    });

    if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return {
        success: true,
        clinicas: user.clinicasAdministradas,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error al obtener clínicas del usuario:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async createClinica(userId: string, dto: CreateClinicaDto) {
    console.log('🏥 USERS SERVICE - createClinica iniciado');
    console.log('🔍 User ID:', userId);
    console.log('🔍 DTO recibido:', JSON.stringify(dto, null, 2));
    console.log('🔍 PlanId en DTO:', dto.planId);
    console.log('🔍 PlanId tipo:', typeof dto.planId);
    
    try {
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar que la URL de la clínica no existe
      const existingClinica = await this.prisma.clinica.findUnique({
        where: { url: dto.url },
      });

      if (existingClinica) {
        throw new ConflictException('La URL de la clínica ya está en uso');
      }

      // Crear la clínica
      const clinica = await this.prisma.clinica.create({
        data: {
          name: dto.nombre,
          url: dto.url,
          email: dto.email,
          address: dto.direccion,
          phone: dto.telefono,
          descripcion: dto.descripcion,
          colorPrimario: dto.colorPrimario,
          colorSecundario: dto.colorSecundario,
          estado: dto.estado,
          administradorId: userId,
      },
    });

      // Crear un usuario ADMIN para la clínica
      const adminPassword = Math.random().toString(36).slice(-8); // Contraseña temporal
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

      const adminUser = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedAdminPassword,
          name: `Admin ${dto.nombre}`,
          role: 'ADMIN',
        clinicaId: clinica.id,
      },
    });

      // Enviar email con credenciales del admin
      try {
        await this.emailService.sendAdminCredentialsEmail(
          dto.email,
          adminPassword,
          `Admin ${dto.nombre}`,
          dto.nombre,
          dto.url,
        );
      } catch (emailError) {
        console.error('Error al enviar email de credenciales:', emailError);
        // No lanzamos error para no interrumpir la creación
      }

      // Crear suscripción automática si se proporciona planId
      console.log('🔍 VERIFICANDO SUSCRIPCIÓN AUTOMÁTICA EN USERS SERVICE');
      console.log('🔍 dto.planId existe:', !!dto.planId);
      console.log('🔍 dto.planId valor:', dto.planId);
      console.log('🔍 dto.planId tipo:', typeof dto.planId);
      
      let subscription: any = null;
      if (dto.planId) {
        console.log('✅ PlanId detectado en Users Service, creando suscripción automática');
        try {
          // Importar el servicio de suscripciones dinámicamente
          const { SubscriptionsService } = await import('../subscriptions/subscriptions.service');
          const subscriptionsService = new SubscriptionsService(this.prisma);
          
          console.log(`🏥 Creando suscripción automática para clínica ${clinica.id} con plan ${dto.planId}`);
          const subscriptionResult = await subscriptionsService.createTrialSubscription(
            clinica.id,
            dto.planId
          );
          console.log(`✅ Suscripción creada exitosamente:`, subscriptionResult);
          subscription = subscriptionResult.suscripcion;
        } catch (subscriptionError) {
          console.error('❌ Error al crear suscripción automática:', subscriptionError);
          // No lanzamos error para no interrumpir la creación de la clínica
        }
      } else {
        console.log('❌ No hay planId en Users Service, saltando suscripción automática');
      }

      const response = {
        success: true,
        message: 'Clínica creada exitosamente',
        clinica: {
          id: clinica.id,
          name: clinica.name,
          url: clinica.url,
          estado: clinica.estado,
        },
        adminCredentials: {
          email: dto.email,
          password: adminPassword,
          note: 'Guarda estas credenciales para acceder a la clínica',
        },
        subscription: subscription ? {
          id: subscription.id,
          estado: subscription.estado,
          fechaInicio: subscription.fechaInicio,
          fechaTrialFin: subscription.fechaTrialFin,
          trialDias: subscription.trialDias,
          plan: subscription.plan
        } : null,
      };

      console.log('🔍 RESPUESTA FINAL USERS SERVICE:');
      console.log('🔍 subscription en response:', response.subscription);
      console.log('🔍 subscription existe:', !!response.subscription);

      return response;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      console.error('Error al crear clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }

  async checkClinicaAccess(userId: string, clinicaUrl: string) {
    try {
      const user = await this.prisma.user.findUnique({
      where: { id: userId },
        include: {
          clinicasAdministradas: {
            where: { url: clinicaUrl },
      select: {
        id: true,
        name: true,
              url: true,
        estado: true,
            },
          },
      },
    });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const clinica = user.clinicasAdministradas[0];

      if (!clinica) {
        throw new UnauthorizedException('No tienes acceso a esta clínica');
      }

      return {
        success: true,
        hasAccess: true,
        clinica,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('Error al verificar acceso a clínica:', error);
      throw new BadRequestException('Error interno del servidor');
    }
  }
}