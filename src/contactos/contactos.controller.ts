import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Query, 
  Put, 
  Req, 
  UseGuards,
  ValidationPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ContactosService } from './contactos.service';
import { CreateContactoDto } from './dto/create-contacto.dto';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller('api/contact')
export class ContactosController {
  constructor(private readonly contactosService: ContactosService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(
    @Body(new ValidationPipe({ 
      transform: true, 
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.BAD_REQUEST
    })) 
    createContactoDto: CreateContactoDto,
    @Req() request: any
  ) {
    // Extraer información de la request para logging
    const requestInfo = {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      referer: request.headers['referer'],
      timestamp: new Date().toISOString(),
    };

    return await this.contactosService.create(createContactoDto, requestInfo);
  }

  // Endpoints de administración (requieren autenticación)
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('estado') estado?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    
    return await this.contactosService.findAll(pageNum, limitNum, estado);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return await this.contactosService.findOne(id);
  }

  @Put(':id/estado')
  @UseGuards(JwtAuthGuard)
  async updateEstado(
    @Param('id') id: string,
    @Body() body: { estado: string; notas?: string }
  ) {
    return await this.contactosService.updateEstado(id, body.estado, body.notas);
  }
}
