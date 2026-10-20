import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  IsInt,
} from 'class-validator';

export class UpdatePurchaseDto {
  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  capacity?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  imei?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  purchasePrice?: number;

  @IsNumber()
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
