import { Module } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';
import { SucursalesController } from './sucursales.controller';
// import { TratamientosController } from './tratamientos.controller'; // Removido - usando el nuevo módulo
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../email/email.service';
@Module({
  imports: [PrismaModule],
  controllers: [ProfessionalsController, SucursalesController], // TratamientosController removido
  providers: [ProfessionalsService, EmailService],
  exports: [ProfessionalsService], // Exportar el servicio para que otros módulos puedan usarlo
})
export class ProfessionalsModule {}
