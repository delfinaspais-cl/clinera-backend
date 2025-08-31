import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { PatientsModule } from './patients/patients.module';
import { UsersModule } from './users/users.module';
import { OwnersModule } from './owners/owners.module';
import { ClinicasModule } from './clinicas/clinicas.module';
import { PublicModule } from './public/public.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ReportsModule } from './reports/reports.module';
import { MensajesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HorariosModule } from './horarios/horarios.module';
import { EspecialidadesModule } from './especialidades/especialidades.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ContactosModule } from './contactos/contactos.module';
import { EmailModule } from './email/email.module';
import { PlansModule } from './plans/plans.module';
import { PaymentsModule } from './payments/payments.module';
import { ConfigModule } from '@nestjs/config';
import { AppController, RootController } from './app.controller';
import { AppService } from './app.service';
import { OwnersService } from './owners/owners.service';

// Importar los nuevos controladores globales
import { GlobalClinicasController } from './clinicas/global-clinicas.controller';
import { GlobalTurnosController } from './turnos/global-turnos.controller';
import { GlobalPatientsController } from './patients/global-patients.controller';
import { GlobalProfessionalsController } from './professionals/global-professionals.controller';
import { GlobalNotificationsController } from './notifications/global-notifications.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
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
    MensajesModule,
    NotificationsModule,
    HorariosModule,
    EspecialidadesModule,
    PushNotificationsModule,
    WhatsAppModule,
    ContactosModule,
    EmailModule,
    PlansModule,
    PaymentsModule,
  ],
  controllers: [
    RootController, 
    AppController, 
    GlobalClinicasController,
    GlobalTurnosController,
    GlobalPatientsController,
    GlobalProfessionalsController,
    GlobalNotificationsController,
  ],
  providers: [AppService, OwnersService],
})
export class AppModule {}
