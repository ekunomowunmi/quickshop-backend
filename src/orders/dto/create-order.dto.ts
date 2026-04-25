import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { FulfillmentType, PaymentMethod } from '../order.entity';

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

  @IsEnum(FulfillmentType)
  fulfillment_type!: FulfillmentType;

  @IsOptional()
  @IsString()
  delivery_address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  delivery_lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  delivery_lng?: number;

  @IsEnum(PaymentMethod)
  payment_method!: PaymentMethod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

