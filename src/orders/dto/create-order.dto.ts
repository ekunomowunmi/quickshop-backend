import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  product_id!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsUUID()
  user_id!: string;

  @IsUUID()
  store_id!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

