// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateProfessionalDto } from './dto/create-professional.dto';
// import * as bcrypt from 'bcrypt';

// @Injectable()
// export class ProfessionalsService {
//   constructor(private prisma: PrismaService) {}

//   async create(dto: CreateProfessionalDto) {
//     const hashed = await bcrypt.hash(dto.password, 10);

//     return this.prisma.user.create({
//       data: {
//         email: dto.email,
//         password: hashed,
//         role: 'PROFESSIONAL',
//         professional: {
//           create: {
//             name: dto.name,
//             specialties: dto.specialties,
//             defaultDurationMin: dto.defaultDurationMin ?? 30,
//             bufferMin: dto.bufferMin ?? 10,
//           },
//         },
//       },
//       include: {
//         professional: true,
//       },
//     });
//   }

//   async findAll() {
//     return this.prisma.professional.findMany({
//       include: {
//         user: true,
//       },
//     });
//   }
// }
