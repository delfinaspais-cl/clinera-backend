import { PartialType } from '@nestjs/mapped-types';
import { CreateMedioPagoDto } from './create-medio-pago.dto';

export class UpdateMedioPagoDto extends PartialType(CreateMedioPagoDto) {}
