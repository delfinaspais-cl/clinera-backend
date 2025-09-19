import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PermissionsService } from './services/permissions.service';
import { MensapiIntegrationService } from './services/mensapi-integration.service';
import { EmailService } from '../email/email.service';
import { PasswordGenerator } from '../common/utils/password-generator';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mensapiIntegration: MensapiIntegrationService,
    private emailService: EmailService,
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

  async createUser(createUserDto: CreateUserDto, clinicaId?: string) {
    // Verificar si el email ya existe en la misma clínica
    const whereCondition = clinicaId 
      ? { email: createUserDto.email, clinicaId: clinicaId }
      : { email: createUserDto.email, clinicaId: null };

    const existingUser = await this.prisma.user.findFirst({
      where: whereCondition,
    });

    if (existingUser) {
      throw new ConflictException('El email ya está en uso en esta clínica');
    }

    // Generar contraseña automáticamente (siempre, para mayor seguridad)
    const generatedPassword = PasswordGenerator.generateTempPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    console.log(`🔐 Contraseña generada para ${createUserDto.email}: ${generatedPassword}`);

    // Obtener permisos según el rol
    const permisos = PermissionsService.getPermisosPorRol(createUserDto.tipo);
    const permisosString = PermissionsService.getPermisosAsString(permisos);

    // Crear el usuario
    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.nombre,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.tipo,
        phone: createUserDto.phone,
        clinicaId: clinicaId || null, // Asociar a clínica si se proporciona
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
      
      // Obtener nombre y URL de la clínica si hay clinicaId
      let clinicaName = 'Clinera'; // Nombre por defecto
      let clinicaUrl: string | undefined = undefined; // URL por defecto
      if (clinicaId) {
        try {
          const clinica = await this.prisma.clinica.findUnique({
            where: { id: clinicaId },
            select: { name: true, url: true }
          });
          if (clinica) {
            clinicaName = clinica.name;
            clinicaUrl = clinica.url;
          }
        } catch (error) {
          console.warn('No se pudo obtener la información de la clínica:', error);
        }
      }
      
      const emailSent = await this.emailService.sendWelcomeCredentialsEmail(
        createUserDto.email,
        generatedPassword,
        createUserDto.nombre,
        createUserDto.tipo,
        clinicaName
      );

      if (emailSent) {
        console.log(`✅ Email de bienvenida enviado exitosamente a ${createUserDto.email}`);
        emailResult = { success: true };
      } else {
        console.error(`❌ Error al enviar email de bienvenida a ${createUserDto.email}`);
        emailResult = { success: false, error: 'Error al enviar email' };
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
    try {
      console.log(`🔍 createUserForClinica: Buscando clínica con URL: ${clinicaUrl}`);
      console.log(`🔍 createUserForClinica: DTO recibido:`, createUserDto);
    
    // Buscar la clínica por URL (el parámetro clinicaUrl es la URL de la clínica)
    console.log(`🔍 Buscando clínica por URL: ${clinicaUrl}`);
    const clinica = await this.prisma.clinica.findUnique({
      where: { url: clinicaUrl },
    });

    if (!clinica) {
      console.log(`❌ Clínica no encontrada: ${clinicaUrl}`);
      throw new NotFoundException(`Clínica con URL '${clinicaUrl}' no encontrada`);
    }

    console.log(`✅ Clínica encontrada: ${clinica.name} (ID: ${clinica.id})`);

    // Verificar si el email ya existe en esta clínica específica
    // Usar el ID de la clínica encontrada por URL, no el clinicaId del payload
    console.log(`🔍 Verificando si email ${createUserDto.email} ya existe en clínica ${clinica.id}`);
    const existingUser = await this.prisma.user.findFirst({
      where: { 
        email: createUserDto.email,
        clinicaId: clinica.id
      },
    });

    if (existingUser) {
      console.log(`❌ Email ya existe en esta clínica: ${createUserDto.email}`);
      throw new ConflictException('El email ya está en uso en esta clínica');
    }

    console.log(`✅ Email disponible en esta clínica: ${createUserDto.email}`);

    // Log específico para el email problemático
    if (createUserDto.email === 'delfina.spais@oacg.cl') {
      console.log(`🔍 DEBUG ESPECÍFICO: Procesando email delfina.spais@oacg.cl`);
      console.log(`🔍 DEBUG ESPECÍFICO: Clínica ID: ${clinica.id}`);
      console.log(`🔍 DEBUG ESPECÍFICO: DTO completo:`, JSON.stringify(createUserDto, null, 2));
    }

    // Generar contraseña automáticamente (siempre, para mayor seguridad)
    const generatedPassword = PasswordGenerator.generateTempPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    console.log(`🔐 Contraseña generada para ${createUserDto.email}: ${generatedPassword}`);

    // Obtener permisos según el rol
    const permisos = PermissionsService.getPermisosPorRol(createUserDto.tipo);
    const permisosString = PermissionsService.getPermisosAsString(permisos);

    // Log específico para el email problemático antes de crear
    if (createUserDto.email === 'delfina.spais@oacg.cl') {
      console.log(`🔍 DEBUG ESPECÍFICO: Antes de crear usuario con email delfina.spais@oacg.cl`);
      console.log(`🔍 DEBUG ESPECÍFICO: Datos a insertar:`, {
        name: createUserDto.nombre,
        email: createUserDto.email,
        role: createUserDto.tipo,
        phone: createUserDto.phone,
        clinicaId: clinica.id,
        estado: 'pendiente'
      });
    }

    // Crear el usuario asociado a la clínica correcta
    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.nombre,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.tipo,
        phone: createUserDto.phone,
        clinicaId: clinica.id, // Usar el ID de la clínica encontrada por URL
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
      
      const emailSent = await this.emailService.sendWelcomeCredentialsEmail(
        createUserDto.email,
        generatedPassword,
        createUserDto.nombre,
        createUserDto.tipo,
        clinica.name
      );

      if (emailSent) {
        console.log(`✅ Email de bienvenida enviado exitosamente a ${createUserDto.email}`);
        emailResult = { success: true };
      } else {
        console.error(`❌ Error al enviar email de bienvenida a ${createUserDto.email}`);
        emailResult = { success: false, error: 'Error al enviar email' };
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
    } catch (error) {
      console.error('❌ Error en createUserForClinica:', error);
      throw error;
    }
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

    // Si se está cambiando el email, verificar que no esté en uso por otro usuario en la misma clínica
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          clinicaId: clinica.id, // Solo verificar en la misma clínica
          id: { not: userId }, // Excluir el usuario actual
        },
      });

      if (emailExists) {
        throw new ConflictException('El email ya está en uso por otro usuario en esta clínica');
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.estado !== undefined) updateData.estado = dto.estado;
    if (dto.permisos !== undefined) updateData.configuracion = JSON.stringify(dto.permisos);

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

  async debugCheckEmail(clinicaUrl: string, email: string) {
    try {
      console.log(`🔍 DEBUG: Verificando email ${email} para clínica ${clinicaUrl}`);
      
      // Buscar la clínica
      const clinica = await this.prisma.clinica.findUnique({
        where: { url: clinicaUrl },
      });

      if (!clinica) {
        return { error: `Clínica con URL '${clinicaUrl}' no encontrada` };
      }

      console.log(`✅ Clínica encontrada: ${clinica.name} (ID: ${clinica.id})`);

      // Buscar usuarios con ese email en esa clínica
      const usersInClinica = await this.prisma.user.findMany({
        where: { 
          email: email,
          clinicaId: clinica.id
        },
      });

      // Buscar usuarios con ese email en cualquier clínica
      const usersAnywhere = await this.prisma.user.findMany({
        where: { 
          email: email
        },
      });

      // Buscar usuarios con ese email sin clínica
      const usersWithoutClinica = await this.prisma.user.findMany({
        where: { 
          email: email,
          clinicaId: null
        },
      });

      return {
        clinica: {
          id: clinica.id,
          name: clinica.name,
          url: clinica.url
        },
        email: email,
        usersInClinica: usersInClinica.length,
        usersAnywhere: usersAnywhere.length,
        usersWithoutClinica: usersWithoutClinica.length,
        canCreate: usersInClinica.length === 0,
        details: {
          inClinica: usersInClinica.map(u => ({ id: u.id, clinicaId: u.clinicaId, role: u.role })),
          anywhere: usersAnywhere.map(u => ({ id: u.id, clinicaId: u.clinicaId, role: u.role })),
          withoutClinica: usersWithoutClinica.map(u => ({ id: u.id, clinicaId: u.clinicaId, role: u.role }))
        }
      };
    } catch (error) {
      console.error('❌ Error en debugCheckEmail:', error);
      return { error: error.message };
    }
  }
}
