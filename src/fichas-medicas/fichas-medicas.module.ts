import { Module } from '@nestjs/common';
import { FichasMedicasController } from './fichas-medicas.controller';
import { FichasMedicasService } from './fichas-medicas.service';
import { StorageService } from './services/storage.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FichasMedicasController],
  providers: [FichasMedicasService, StorageService],
  exports: [FichasMedicasService],
})
export class FichasMedicasModule {}


