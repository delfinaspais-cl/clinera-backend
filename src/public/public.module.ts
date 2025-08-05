import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ClinicasModule } from '../clinicas/clinicas.module';

@Module({
  imports: [ClinicasModule],
  controllers: [PublicController],
})
export class PublicModule {} 