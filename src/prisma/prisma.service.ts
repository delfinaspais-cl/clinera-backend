import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly config: ConfigService) {
    const url = config.get<string>('DATABASE_URL') ?? process.env.DATABASE_URL;
    console.log('DB URL present?', !!(process.env.DATABASE_URL));


    // Si no hay URL, no pases datasources para no inyectar "undefined"
    super(url ? { datasources: { db: { url } } } : {});
  }
  

  async onModuleInit() {
    await this.$connect();
    console.log('Conexión exitosa a la base de datos');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}