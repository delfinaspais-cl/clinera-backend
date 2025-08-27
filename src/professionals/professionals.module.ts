import { Module } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';
import { SucursalesController } from './sucursales.controller';
import { TratamientosController } from './tratamientos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProfessionalsController, SucursalesController, TratamientosController],
  providers: [ProfessionalsService],
  exports: [ProfessionalsService], // Exportar el servicio para que otros módulos puedan usarlo
})
export class ProfessionalsModule {}
