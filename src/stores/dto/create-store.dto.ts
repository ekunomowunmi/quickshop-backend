import { Type } from 'class-transformer';
import { IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateStoreDto {
  @IsUUID()
  ownerId!: string;

  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  address!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

