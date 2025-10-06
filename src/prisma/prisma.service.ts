import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly config: ConfigService) {
    const url = config.get<string>('DATABASE_URL') ?? process.env.DATABASE_URL;
    console.log('DB URL present?', !!process.env.DATABASE_URL);

    // Configuración optimizada para Railway
    const configOptions = url ? {
      datasources: { 
        db: { 
          url: url + '?connection_limit=5&pool_timeout=20&connect_timeout=60'
        } 
      },
      log: ['error'], // Solo logs de error
      errorFormat: 'minimal'
    } : {};

    super(configOptions);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Conexión exitosa a la base de datos');
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error.message);
      // No lanzar el error, permitir que la aplicación continúe
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      console.log('✅ Conexión a base de datos cerrada');
    } catch (error) {
      console.error('❌ Error cerrando conexión:', error.message);
    }
  }
}
