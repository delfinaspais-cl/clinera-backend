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
      // Verificar si el email ya existe
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: dto.email },
      });

      if (existingEmail) {
        throw new ConflictException('El email ya está registrado');
      }

      // Verificar si el username ya existe
      const existingUsername = await this.prisma.user.findFirst({
        where: { username: dto.username },
      });

      if (existingUsername) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Crear el usuario
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          password: hashedPassword,
          name: dto.name,
          role: 'OWNER', // Los usuarios registrados son OWNER por defecto
          clinicaId: null, // No tienen clínica específica inicialmente
        },
      });

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
      // Buscar usuario por username o email
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: dto.username },
            { email: dto.username },
          ],
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
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          phone: true,
          role: true,
          estado: true,
          createdAt: true,
          avatar_url: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return {
        success: true,
        user,
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

      return {
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
      };
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