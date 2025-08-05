import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfessionalsModule } from '../src/professionals/professionals.module';
import { PatientsModule } from './patients/patients.module';
import { UsersModule } from './users/users.module';
import { OwnersModule } from './owners/owners.module';
import { ClinicasModule } from './clinicas/clinicas.module';
import { PublicModule } from './public/public.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ReportsModule } from './reports/reports.module';
import { MensajesModule } from './messages/messages.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProfessionalsModule,
    PatientsModule,
    UsersModule,
    OwnersModule,
    ClinicasModule,
    PublicModule,
    ScheduleModule,
    ReportsModule,
    MensajesModule
    // otros módulos
  ],
})
export class AppModule {}

