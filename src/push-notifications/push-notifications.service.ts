import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService, PushNotificationPayload } from './services/firebase.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
  ) {}

  async registerDeviceToken(
    userId: string,
    dto: RegisterDeviceTokenDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar si el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado',
        };
      }

      // Verificar si ya existe un token para este dispositivo
      const existingToken = await this.prisma.pushNotificationToken.findFirst({
        where: {
          userId,
          deviceId: dto.deviceId,
          platform: dto.platform,
        },
      });

      if (existingToken) {
        // Actualizar el token existente
        await this.prisma.pushNotificationToken.update({
          where: { id: existingToken.id },
          data: {
            token: dto.token,
            isActive: true,
            updatedAt: new Date(),
          },
        });

        this.logger.log(`Token actualizado para usuario ${userId}`);
        return {
          success: true,
          message: 'Token de dispositivo actualizado exitosamente',
        };
      }

      // Crear nuevo token
      await this.prisma.pushNotificationToken.create({
        data: {
          userId,
          token: dto.token,
          platform: dto.platform,
          deviceId: dto.deviceId,
          isActive: true,
        },
      });

      this.logger.log(`Nuevo token registrado para usuario ${userId}`);
      return {
        success: true,
        message: 'Token de dispositivo registrado exitosamente',
      };
    } catch (error) {
      this.logger.error('Error registrando token de dispositivo:', error);
      return {
        success: false,
        message: 'Error interno del servidor',
      };
    }
  }

  async unregisterDeviceToken(
    userId: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.prisma.pushNotificationToken.updateMany({
        where: {
          userId,
          token,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      if (result.count > 0) {
        this.logger.log(`Token desactivado para usuario ${userId}`);
        return {
          success: true,
          message: 'Token de dispositivo desactivado exitosamente',
        };
      }

      return {
        success: false,
        message: 'Token no encontrado',
      };
    } catch (error) {
      this.logger.error('Error desactivando token de dispositivo:', error);
      return {
        success: false,
        message: 'Error interno del servidor',
      };
    }
  }

  async sendNotification(dto: SendNotificationDto): Promise<{
    success: boolean;
    message: string;
    results?: any[];
  }> {
    try {
      let tokens: string[] = [];

      // Obtener tokens según los criterios especificados
      if (dto.userIds && dto.userIds.length > 0) {
        // Enviar a usuarios específicos
        const userTokens = await this.prisma.pushNotificationToken.findMany({
          where: {
            userId: { in: dto.userIds },
            isActive: true,
            ...(dto.platforms && { platform: { in: dto.platforms } }),
          },
          select: { token: true },
        });
        tokens = userTokens.map(t => t.token);
      } else if (dto.clinicaId) {
        // Enviar a todos los usuarios de una clínica
        const clinicaTokens = await this.prisma.pushNotificationToken.findMany({
          where: {
            user: {
              clinicaId: dto.clinicaId,
            },
            isActive: true,
            ...(dto.platforms && { platform: { in: dto.platforms } }),
          },
          select: { token: true },
        });
        tokens = clinicaTokens.map(t => t.token);
      } else {
        return {
          success: false,
          message: 'Debe especificar userIds o clinicaId',
        };
      }

      if (tokens.length === 0) {
        return {
          success: true,
          message: 'No hay dispositivos registrados para enviar la notificación',
        };
      }

      // Preparar payload de la notificación
      const payload: PushNotificationPayload = {
        title: dto.title,
        body: dto.body,
        data: dto.data,
        imageUrl: dto.imageUrl,
      };

      // Enviar notificación
      const results = await this.firebaseService.sendNotificationToMultipleTokens(
        tokens,
        payload,
      );

      // Contar resultados exitosos
      const successfulCount = results.filter(r => r.success).length;
      const failedCount = results.length - successfulCount;

      this.logger.log(
        `Notificación enviada: ${successfulCount} exitosas, ${failedCount} fallidas`,
      );

      return {
        success: true,
        message: `Notificación enviada a ${tokens.length} dispositivos (${successfulCount} exitosas, ${failedCount} fallidas)`,
        results,
      };
    } catch (error) {
      this.logger.error('Error enviando notificación push:', error);
      return {
        success: false,
        message: 'Error interno del servidor',
      };
    }
  }

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const tokens = await this.prisma.pushNotificationToken.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: { token: true },
      });

      if (tokens.length === 0) {
        return {
          success: true,
          message: 'Usuario no tiene dispositivos registrados',
        };
      }

      const payload: PushNotificationPayload = {
        title,
        body,
        data,
      };

      const results = await this.firebaseService.sendNotificationToMultipleTokens(
        tokens.map(t => t.token),
        payload,
      );

      const successfulCount = results.filter(r => r.success).length;

      this.logger.log(
        `Notificación enviada a usuario ${userId}: ${successfulCount}/${tokens.length} exitosas`,
      );

      return {
        success: true,
        message: `Notificación enviada a ${successfulCount} dispositivos`,
      };
    } catch (error) {
      this.logger.error('Error enviando notificación a usuario:', error);
      return {
        success: false,
        message: 'Error interno del servidor',
      };
    }
  }

  async getUserTokens(userId: string): Promise<{
    success: boolean;
    tokens?: any[];
    message?: string;
  }> {
    try {
      const tokens = await this.prisma.pushNotificationToken.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          id: true,
          token: true,
          platform: true,
          deviceId: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        tokens,
      };
    } catch (error) {
      this.logger.error('Error obteniendo tokens del usuario:', error);
      return {
        success: false,
        message: 'Error interno del servidor',
      };
    }
  }

  async cleanupInactiveTokens(): Promise<void> {
    try {
      // Eliminar tokens inactivos que tengan más de 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.pushNotificationToken.deleteMany({
        where: {
          isActive: false,
          updatedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      if (result.count > 0) {
        this.logger.log(`${result.count} tokens inactivos eliminados`);
      }
    } catch (error) {
      this.logger.error('Error limpiando tokens inactivos:', error);
    }
  }
}
