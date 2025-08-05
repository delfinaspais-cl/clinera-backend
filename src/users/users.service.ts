import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

}