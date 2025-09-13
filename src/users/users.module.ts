import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { ClinicaUsersController } from './clinica-users.controller';
import { ClinicaUsuariosController } from './clinica-usuarios.controller';
import { UsersService } from './users.service';
import { MensapiIntegrationService } from './services/mensapi-integration.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [UsersController, ClinicaUsersController, ClinicaUsuariosController],
  providers: [UsersService, MensapiIntegrationService],
})
export class UsersModule {}
