import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AdvancedAuditInterceptor } from './interceptors/advanced-audit.interceptor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditInterceptor,
    AdvancedAuditInterceptor,
  ],
  exports: [
    AuditService,
    AuditInterceptor,
    AdvancedAuditInterceptor,
  ], // Exportamos el servicio e interceptores para que otros módulos puedan usarlos
})
export class AuditModule {}
