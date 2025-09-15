import { Module } from '@nestjs/common';
import { FichasMedicasController } from './fichas-medicas.controller';
import { FichasMedicasService } from './fichas-medicas.service';
import { FichasMedicasHistorialController, FichasMedicasGlobalController } from './fichas-medicas-historial.controller';
import { FichasMedicasHistorialService } from './fichas-medicas-historial.service';
import { StorageService } from './services/storage.service';
import { FileMicroserviceService } from './services/file-microservice.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    FichasMedicasController,
    FichasMedicasHistorialController,
    FichasMedicasGlobalController
  ],
  providers: [
    FichasMedicasService,
    FichasMedicasHistorialService,
    StorageService,
    FileMicroserviceService
  ],
  exports: [
    FichasMedicasService,
    FichasMedicasHistorialService
  ],
})
export class FichasMedicasModule {}


