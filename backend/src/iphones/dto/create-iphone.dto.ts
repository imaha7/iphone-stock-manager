import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsInt,
} from 'class-validator';

export class CreateIphoneDto {
  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  capacity: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  imei: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  purchasePrice: number;

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
