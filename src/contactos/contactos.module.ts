import { Module } from '@nestjs/common';
import { ContactosController } from './contactos.controller';
import { ContactosService } from './contactos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [ContactosController],
  providers: [ContactosService],
  exports: [ContactosService],
})
export class ContactosModule {}
