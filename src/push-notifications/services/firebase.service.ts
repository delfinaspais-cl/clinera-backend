import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

export interface PushNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Inicializar Firebase Admin SDK
    // En producción, deberías usar un archivo de credenciales de servicio
    // o variables de entorno para las credenciales
    try {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: this.configService.get('FIREBASE_PROJECT_ID'),
      });
      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      // En desarrollo, podemos continuar sin Firebase
    }
  }

  async sendNotificationToToken(
    token: string,
    payload: PushNotificationPayload,
  ): Promise<PushNotificationResult> {
    try {
      if (!this.firebaseApp) {
        return {
          success: false,
          error: 'Firebase not initialized',
        };
      }

      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'clinera-notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
          },
        },
      };

      const response = await this.firebaseApp.messaging().send(message);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendNotificationToMultipleTokens(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<PushNotificationResult[]> {
    if (!this.firebaseApp) {
      return tokens.map(() => ({
        success: false,
        error: 'Firebase not initialized',
      }));
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'clinera-notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
      },
    };

    try {
      const response = await this.firebaseApp
        .messaging()
        .sendEachForMulticast(message);

      return response.responses.map((resp, index) => ({
        success: resp.success,
        messageId: resp.messageId,
        error: resp.error?.message,
      }));
    } catch (error) {
      console.error('Error sending multicast push notification:', error);
      return tokens.map(() => ({
        success: false,
        error: error.message,
      }));
    }
  }

  async sendNotificationToTopic(
    topic: string,
    payload: PushNotificationPayload,
  ): Promise<PushNotificationResult> {
    try {
      if (!this.firebaseApp) {
        return {
          success: false,
          error: 'Firebase not initialized',
        };
      }

      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'clinera-notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
          },
        },
      };

      const response = await this.firebaseApp.messaging().send(message);

      return {
        success: true,
        messageId: response,
      };
    } catch (error) {
      console.error('Error sending topic push notification:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
