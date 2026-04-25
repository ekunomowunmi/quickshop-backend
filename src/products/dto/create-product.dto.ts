import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  price!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsUUID()
  store_id!: string;
}

