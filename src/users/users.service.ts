import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PermissionsService } from './services/permissions.service';
import { MensapiIntegrationService } from './services/mensapi-integration.service';
import { ExternalEmailService } from '../email/external-email.service';
import { PasswordGenerator } from '../common/utils/password-generator';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mensapiIntegration: MensapiIntegrationService,
    private externalEmailService: ExternalEmailService,
  ) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  async findMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        location: dto.location,
        bio: dto.bio,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findPatients() {
    return this.prisma.user.findMany({
      where: {
        role: 'PATIENT',
      },
    });
  }

  async createUser(createUserDto: CreateUserDto) {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está en uso');
    }

    // Generar contraseña automáticamente (siempre, para mayor seguridad)
    const generatedPassword = PasswordGenerator.generateTempPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    console.log(`🔐 Contraseña generada para ${createUserDto.email}: ${generatedPassword}`);

    // Obtener permisos según el rol
    const permisos = PermissionsService.getPermisosPorRol(createUserDto.tipo);
    const permisosString = PermissionsService.getPermisosAsString(permisos);

    // Crear el usuario (sin clinicaId específico)
    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.nombre,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.tipo,
        phone: createUserDto.phone,
        clinicaId: null, // No asociado a clínica específica
        estado: 'pendiente', // Estado inicial como pendiente
        configuracion: permisosString, // Guardar permisos en configuracion
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        estado: true,
        createdAt: true,
        phone: true,
        clinicaId: true,
      },
    });

    // Enviar email de bienvenida con credenciales
    let emailResult: { success: boolean; error?: string } = { success: false, error: 'No se intentó enviar' };
    try {
      console.log(`📧 Enviando email de bienvenida a ${createUserDto.email}...`);
      
      emailResult = await this.externalEmailService.sendWelcomeEmail({
        to: createUserDto.email,
        name: createUserDto.nombre,
        email: createUserDto.email,
        password: generatedPassword, // Enviar la contraseña en texto plano
        role: createUserDto.tipo,
        clinicaName: 'Clinera', // Nombre por defecto
      });

      if (emailResult.success) {
        console.log(`✅ Email de bienvenida enviado exitosamente a ${createUserDto.email}`);
      } else {
        console.error(`❌ Error al enviar email de bienvenida a ${createUserDto.email}:`, emailResult.error);
        // No lanzamos error para no interrumpir la creación del usuario
      }
    } catch (emailError) {
      console.error(`❌ Error inesperado al enviar email de bienvenida a ${createUserDto.email}:`, emailError);
      emailResult = { success: false, error: emailError.message || 'Error inesperado' };
      // No lanzamos error para no interrumpir la creación del usuario
    }

    return {
      ...user,
      permisos,
      emailEnviado: emailResult.success,
      fechaEmailEnviado: emailResult.success ? new Date().toISOString() : null,
      emailError: emailResult.error,
      // No devolver la contraseña en la respuesta por seguridad
      message: emailResult.success 
        ? 'Usuario creado exitosamente. Se ha enviado un email con las credenciales de acceso.'
        : 'Usuario creado exitosamente, pero no se pudo enviar el email de bienvenida.',
    };
  }

  async createUserForClinica(clinicaUrl: string, createUserDto: CreateUserDto) {
    // Buscar la clínica por URL
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
    }

    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está en uso');
    }

    // Generar contraseña automáticamente (siempre, para mayor seguridad)
    const generatedPassword = PasswordGenerator.generateTempPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    console.log(`🔐 Contraseña generada para ${createUserDto.email}: ${generatedPassword}`);

    // Obtener permisos según el rol
    const permisos = PermissionsService.getPermisosPorRol(createUserDto.tipo);
    const permisosString = PermissionsService.getPermisosAsString(permisos);

    // Crear el usuario asociado a la clínica
    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.nombre,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.tipo,
        phone: createUserDto.phone,
        clinicaId: clinica.id, // Asociar con la clínica encontrada
        estado: 'pendiente', // Estado inicial como pendiente
        configuracion: permisosString, // Guardar permisos en configuracion
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        estado: true,
        createdAt: true,
        phone: true,
        clinicaId: true,
      },
    });

    // Enviar email de bienvenida con credenciales
    let emailResult: { success: boolean; error?: string } = { success: false, error: 'No se intentó enviar' };
    try {
      console.log(`📧 Enviando email de bienvenida a ${createUserDto.email}...`);
      
      emailResult = await this.externalEmailService.sendWelcomeEmail({
        to: createUserDto.email,
        name: createUserDto.nombre,
        email: createUserDto.email,
        password: generatedPassword, // Enviar la contraseña en texto plano
        role: createUserDto.tipo,
        clinicaName: clinica.name,
      });

      if (emailResult.success) {
        console.log(`✅ Email de bienvenida enviado exitosamente a ${createUserDto.email}`);
      } else {
        console.error(`❌ Error al enviar email de bienvenida a ${createUserDto.email}:`, emailResult.error);
        // No lanzamos error para no interrumpir la creación del usuario
      }
    } catch (emailError) {
      console.error(`❌ Error inesperado al enviar email de bienvenida a ${createUserDto.email}:`, emailError);
      emailResult = { success: false, error: emailError.message || 'Error inesperado' };
      // No lanzamos error para no interrumpir la creación del usuario
    }

    // Intentar registrar el usuario en mensapi (no bloquea si falla)
    let mensapiResult: any = null;
    try {
      mensapiResult = await this.mensapiIntegration.registerUser({
        name: createUserDto.nombre,
        email: createUserDto.email,
        password: generatedPassword, // Usar la contraseña generada
        phone: createUserDto.phone,
      }, clinica.mensapiServiceEmail || undefined, clinica.mensapiServicePassword || undefined);
    } catch (error) {
      // Log del error pero no fallar la creación del usuario
      console.warn('Error registrando usuario en mensapi:', error.message);
    }

    return {
      ...user,
      permisos,
      clinica: {
        id: clinica.id,
        name: clinica.name,
        url: clinica.url,
      },
      emailEnviado: emailResult.success,
      fechaEmailEnviado: emailResult.success ? new Date().toISOString() : null,
      emailError: emailResult.error,
      mensapi: mensapiResult ? {
        registered: true,
        accessToken: mensapiResult.content.accessToken,
        refreshToken: mensapiResult.content.refreshToken,
      } : {
        registered: false,
        error: 'No se pudo registrar en mensapi',
      },
    };
  }

  async findAllForClinica(clinicaUrl: string) {
    // Buscar la clínica por URL
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
    }

    return this.prisma.user.findMany({
      where: { clinicaId: clinica.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        estado: true,
        createdAt: true,
        phone: true,
        clinicaId: true,
        configuracion: true,
      },
    });
  }

  async findMeForClinica(userId: string, clinicaUrl: string) {
    // Buscar la clínica por URL
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
    }

    const user = await this.prisma.user.findUnique({
      where: { 
        id: userId,
        clinicaId: clinica.id, // Verificar que el usuario pertenece a esta clínica
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado en esta clínica');
    }

    return user;
  }

  async updateProfileForClinica(userId: string, clinicaUrl: string, dto: UpdateProfileDto) {
    // Buscar la clínica por URL
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
    }

    return this.prisma.user.update({
      where: { 
        id: userId,
        clinicaId: clinica.id, // Verificar que el usuario pertenece a esta clínica
      },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        location: dto.location,
        bio: dto.bio,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findPatientsForClinica(clinicaUrl: string) {
    // Buscar la clínica por URL
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
    }

    return this.prisma.user.findMany({
      where: {
        role: 'PATIENT',
        clinicaId: clinica.id,
      },
    });
  }

  async updateUserForClinica(clinicaUrl: string, userId: string, dto: UpdateUserDto) {
    // Buscar la clínica por URL
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
    }

    // Verificar que el usuario existe y pertenece a la clínica
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        clinicaId: clinica.id,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado en esta clínica');
    }

    // Si se está cambiando el email, verificar que no esté en uso por otro usuario
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          id: { not: userId }, // Excluir el usuario actual
        },
      });

      if (emailExists) {
        throw new ConflictException('El email ya está en uso por otro usuario');
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.estado !== undefined) updateData.estado = dto.estado;
    if (dto.configuracion !== undefined) updateData.configuracion = dto.configuracion;

    // Actualizar el usuario
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        estado: true,
        createdAt: true,
        phone: true,
        clinicaId: true,
        configuracion: true,
      },
    });

    return updatedUser;
  }

  async deleteUserForClinica(clinicaUrl: string, userId: string) {
    // Buscar la clínica por URL
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
    }

    // Verificar que el usuario existe y pertenece a la clínica
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        clinicaId: clinica.id,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado en esta clínica');
    }

    // Eliminar el usuario
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Usuario eliminado exitosamente' };
  }
}
