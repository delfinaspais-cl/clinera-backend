import { Module } from '@nestjs/common';
import { MediosPagoService } from './medios-pago.service';
import { MediosPagoController } from './medios-pago.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MediosPagoController],
  providers: [MediosPagoService],
  exports: [MediosPagoService],
})
export class MediosPagoModule {}
