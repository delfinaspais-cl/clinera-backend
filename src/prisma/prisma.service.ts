import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Solución temporal: usar valor hardcodeado si la variable no está disponible
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:iKoiMmWbtINyXaQyMAiLVAsnCKtIiqWg@switchyard.proxy.rlwy.net:20444/railway';
    console.log('Using DATABASE_URL:', databaseUrl);
    
    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks() {
    await this.$disconnect();
  }
}
