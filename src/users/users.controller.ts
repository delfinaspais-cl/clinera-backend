import {
  Controller,
  Get,
  Request,
  UseGuards,
  Patch,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  findMe(@Request() req) {
    return this.usersService.findMe(req.user.id);
  }

  @Patch('me')
  updateMe(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get('patients')
  async findAllPatients() {
    return this.usersService.findPatients();
  }
}
