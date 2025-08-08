import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Debug: Verificar variables de entorno
    console.log('PrismaService constructor - Environment variables:');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    if (process.env.DATABASE_URL) {
      console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 30) + '...');
    }
    
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    console.log('PrismaService onModuleInit - attempting to connect...');
    try {
      await this.$connect();
      console.log('PrismaService connected successfully');
    } catch (error) {
      console.error('PrismaService connection failed:', error.message);
      throw error;
    }
  }

  async enableShutdownHooks() {
    await this.$disconnect();
  }
}
