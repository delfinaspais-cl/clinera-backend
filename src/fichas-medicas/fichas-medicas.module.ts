import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FichasMedicasController } from './fichas-medicas.controller';
import { FichasMedicasService } from './fichas-medicas.service';
import { FichasMedicasHistorialController, FichasMedicasGlobalController } from './fichas-medicas-historial.controller';
import { FichasMedicasHistorialService } from './fichas-medicas-historial.service';
import { StorageService } from './services/storage.service';
import { FileMicroserviceService } from './services/file-microservice.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [
    FichasMedicasController,
    FichasMedicasHistorialController,
    FichasMedicasGlobalController
  ],
  providers: [
    FichasMedicasService,
    FichasMedicasHistorialService,
    StorageService,
    FileMicroserviceService,
    AdminGuard
  ],
  exports: [
    FichasMedicasService,
    FichasMedicasHistorialService
  ],
})
export class FichasMedicasModule {}


