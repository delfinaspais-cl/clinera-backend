import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { PushNotificationsService } from './push-notifications.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('Push Notifications')
@Controller('push-notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Post('register-token')
  @ApiOperation({
    summary: 'Registrar token de dispositivo para notificaciones push',
    description: 'Registra o actualiza el token de un dispositivo para recibir notificaciones push',
  })
  @ApiBody({ type: RegisterDeviceTokenDto })
  @ApiResponse({
    status: 201,
    description: 'Token registrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Token de dispositivo registrado exitosamente' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async registerDeviceToken(
    @Request() req,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    const result = await this.pushNotificationsService.registerDeviceToken(
      req.user.id,
      dto,
    );

    return {
      success: result.success,
      message: result.message,
    };
  }

  @Delete('unregister-token/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desactivar token de dispositivo',
    description: 'Desactiva un token de dispositivo para dejar de recibir notificaciones push',
  })
  @ApiResponse({
    status: 200,
    description: 'Token desactivado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Token de dispositivo desactivado exitosamente' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async unregisterDeviceToken(
    @Request() req,
    @Param('token') token: string,
  ) {
    const result = await this.pushNotificationsService.unregisterDeviceToken(
      req.user.id,
      token,
    );

    return {
      success: result.success,
      message: result.message,
    };
  }

  @Get('my-tokens')
  @ApiOperation({
    summary: 'Obtener tokens del usuario actual',
    description: 'Obtiene todos los tokens de dispositivos registrados del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens obtenidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        tokens: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              token: { type: 'string' },
              platform: { type: 'string' },
              deviceId: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getUserTokens(@Request() req) {
    const result = await this.pushNotificationsService.getUserTokens(req.user.id);

    return {
      success: result.success,
      tokens: result.tokens,
      message: result.message,
    };
  }

  @Post('send')
  @ApiOperation({
    summary: 'Enviar notificación push',
    description: 'Envía una notificación push a usuarios específicos o a toda una clínica',
  })
  @ApiBody({ type: SendNotificationDto })
  @ApiResponse({
    status: 201,
    description: 'Notificación enviada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Notificación enviada a 5 dispositivos (4 exitosas, 1 fallida)' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              messageId: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o falta de destinatarios',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async sendNotification(@Body() dto: SendNotificationDto) {
    const result = await this.pushNotificationsService.sendNotification(dto);

    return {
      success: result.success,
      message: result.message,
      results: result.results,
    };
  }

  @Post('send-to-user/:userId')
  @ApiOperation({
    summary: 'Enviar notificación a usuario específico',
    description: 'Envía una notificación push a un usuario específico',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Nuevo turno confirmado' },
        body: { type: 'string', example: 'Tu turno ha sido confirmado para mañana' },
        data: {
          type: 'object',
          example: { type: 'appointment', appointmentId: '123' },
        },
      },
      required: ['title', 'body'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Notificación enviada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Notificación enviada a 2 dispositivos' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async sendNotificationToUser(
    @Param('userId') userId: string,
    @Body() body: { title: string; body: string; data?: Record<string, any> },
  ) {
    const result = await this.pushNotificationsService.sendNotificationToUser(
      userId,
      body.title,
      body.body,
      body.data,
    );

    return {
      success: result.success,
      message: result.message,
    };
  }
}
