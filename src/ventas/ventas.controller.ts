import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';

@ApiTags('Ventas')
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva venta' })
  @ApiResponse({ status: 201, description: 'Venta creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createVentaDto: CreateVentaDto) {
    return await this.ventasService.create(createVentaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las ventas' })
  @ApiResponse({ status: 200, description: 'Lista de ventas obtenida exitosamente' })
  @ApiQuery({ name: 'clinicaId', required: false, description: 'Filtrar por clínica' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'estadoPago', required: false, description: 'Filtrar por estado de pago' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findAll(
    @Query('clinicaId') clinicaId?: string,
    @Query('estado') estado?: string,
    @Query('estadoPago') estadoPago?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;
    
    return await this.ventasService.findAll(
      clinicaId,
      estado,
      estadoPago,
      limitNum,
      offsetNum,
    );
  }

  @Get('stats/:clinicaId')
  @ApiOperation({ summary: 'Obtener estadísticas de ventas de una clínica' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getStats(@Param('clinicaId') clinicaId: string) {
    return await this.ventasService.getStats(clinicaId);
  }

  @Get('clinica/:clinicaId')
  @ApiOperation({ summary: 'Obtener ventas de una clínica específica' })
  @ApiResponse({ status: 200, description: 'Ventas de la clínica obtenidas exitosamente' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'estadoPago', required: false, description: 'Filtrar por estado de pago' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  async findByClinica(
    @Param('clinicaId') clinicaId: string,
    @Query('estado') estado?: string,
    @Query('estadoPago') estadoPago?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const offsetNum = offset ? parseInt(offset, 10) : undefined;
    
    return await this.ventasService.findByClinica(
      clinicaId,
      estado,
      estadoPago,
      limitNum,
      offsetNum,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta por ID' })
  @ApiResponse({ status: 200, description: 'Venta obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async findOne(@Param('id') id: string) {
    return await this.ventasService.findOne(id);
  }

  @Get('venta-id/:ventaId')
  @ApiOperation({ summary: 'Obtener venta por ventaId personalizado' })
  @ApiResponse({ status: 200, description: 'Venta obtenida exitosamente' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async findByVentaId(@Param('ventaId') ventaId: string) {
    return await this.ventasService.findByVentaId(ventaId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar venta' })
  @ApiResponse({ status: 200, description: 'Venta actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateVentaDto: UpdateVentaDto,
  ) {
    return await this.ventasService.update(id, updateVentaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar venta' })
  @ApiResponse({ status: 200, description: 'Venta eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  async remove(@Param('id') id: string) {
    return await this.ventasService.remove(id);
  }
}
