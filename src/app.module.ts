import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfessionalsModule } from '../src/professionals/professionals.module';
import { PatientsModule } from './patients/patients.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProfessionalsModule,
    PatientsModule,
    UsersModule
    // otros módulos
  ],
})
export class AppModule {}

