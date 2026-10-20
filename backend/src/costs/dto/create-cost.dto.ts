import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsIn,
  Min,
} from 'class-validator';

export class CreateCostDto {
  @IsNumber()
  @IsOptional()
  saleId?: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsIn([
    'Shipping',
    'Service',
    'Operations',
    'Ongkir',
    'Servis',
    'Operasional',
    'shipping',
    'service',
    'operational',
    'ongkir',
    'servis',
    'operasional',
  ])
  category: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
