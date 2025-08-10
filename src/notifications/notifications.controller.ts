import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@UseGuards(JwtAuthGuard)
@Controller('clinica/:clinicaUrl/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Param('clinicaUrl') clinicaUrl: string,
    @Request() req,
  ) {
    return this.notificationsService.findAll(clinicaUrl, req.user.id);
  }

  @Post()
  create(
    @Param('clinicaUrl') clinicaUrl: string,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(clinicaUrl, dto);
  }

  @Get(':id')
  findOne(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.findOne(clinicaUrl, id);
  }

  @Patch(':id')
  update(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(clinicaUrl, id, dto);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(clinicaUrl, id);
  }

  @Delete(':id')
  remove(
    @Param('clinicaUrl') clinicaUrl: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.remove(clinicaUrl, id);
  }

  @Get('stats')
  getStats(@Param('clinicaUrl') clinicaUrl: string) {
    return this.notificationsService.getStats(clinicaUrl);
  }
}
