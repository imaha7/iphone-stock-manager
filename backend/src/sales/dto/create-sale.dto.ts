import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsIn,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdditionalCostItem {
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
}

export class CreateSaleDto {
  @IsNumber()
  @IsNotEmpty()
  iphoneUnitId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  sellingPrice: number;

  @IsNumber()
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsString()
  @IsOptional()
  buyerName?: string;

  @IsString()
  @IsOptional()
  buyerPhone?: string;

  @IsDateString()
  @IsOptional()
  saleDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AdditionalCostItem)
  additionalCosts?: AdditionalCostItem[];
}
