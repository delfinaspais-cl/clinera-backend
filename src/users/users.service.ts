import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PermissionsService } from './services/permissions.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

    // Generar contraseña por defecto si no se proporciona
    const password = createUserDto.password || 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

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

    return {
      ...user,
      permisos,
      sucursales: createUserDto.sucursales || [],
      especialidades: createUserDto.especialidades || [],
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

    // Generar contraseña por defecto si no se proporciona
    const password = createUserDto.password || 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

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

    return {
      ...user,
      permisos,
      sucursales: createUserDto.sucursales || [],
      especialidades: createUserDto.especialidades || [],
      clinica: {
        id: clinica.id,
        name: clinica.name,
        url: clinica.url,
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
}
