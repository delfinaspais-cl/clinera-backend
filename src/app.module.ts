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
import { TratamientosModule } from './tratamientos/tratamientos.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { ContactosModule } from './contactos/contactos.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { FichasMedicasModule } from './fichas-medicas/fichas-medicas.module';
import { VentasModule } from './ventas/ventas.module';
import { MediosPagoModule } from './medios-pago/medios-pago.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OwnersService } from './owners/owners.service';

// Importar los nuevos controladores globales
import { GlobalClinicasController } from './clinicas/global-clinicas.controller';
import { GlobalTurnosController } from './turnos/global-turnos.controller';
import { PublicTurnosController } from './turnos/public-turnos.controller';
import { GlobalPatientsController } from './patients/global-patients.controller';
import { GlobalProfessionalsController } from './professionals/global-professionals.controller';
import { GlobalNotificationsController } from './notifications/global-notifications.controller';
import { GlobalFichasMedicasController } from './fichas-medicas/global-fichas-medicas.controller';
import { GlobalVentasController } from './ventas/global-ventas.controller';
import { GlobalMediosPagoController } from './medios-pago/global-medios-pago.controller';
import { ClinicPatientsController } from './patients/clinic-patients.controller';
import { AdminGuard } from './auth/guards/admin.guard';

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
    TratamientosModule,
    PushNotificationsModule,
    WhatsAppModule,
    ContactosModule,
    EmailModule,
    HealthModule,
    PlansModule,
    SubscriptionsModule,
    FichasMedicasModule,
    VentasModule,
    MediosPagoModule,
    WebhooksModule,
  ],
  controllers: [
    AppController, 
    GlobalClinicasController,
    GlobalTurnosController,
    PublicTurnosController,
    GlobalPatientsController,
    GlobalProfessionalsController,
    GlobalNotificationsController,
    GlobalFichasMedicasController,
    GlobalVentasController,
    GlobalMediosPagoController,
    ClinicPatientsController,
  ],
  providers: [AppService, OwnersService, AdminGuard],
})
export class AppModule {}
