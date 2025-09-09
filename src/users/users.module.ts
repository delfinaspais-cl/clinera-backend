import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { ClinicaUsersController } from './clinica-users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, ClinicaUsersController],
  providers: [UsersService],
})
export class UsersModule {}
