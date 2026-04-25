import { PartialType } from '@nestjs/mapped-types';
import { CreateStoreDto } from './create-store.dto';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

// We extend CreateStoreDto but restrict which fields we actually apply in service.
// ownerId/lat/lng exist in CreateStoreDto but are intentionally ignored on update.
export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @IsOptional()
  @IsBoolean()
  delivery_available?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  base_delivery_fee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  per_km_fee?: number;
}

