import { IsString, IsNumber, IsOptional, Min, IsInt } from 'class-validator';

export class UpdateIphoneDto {
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
  sellingPrice?: number;

  @IsNumber()
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsString()
  @IsOptional()
  status?: string;
}
