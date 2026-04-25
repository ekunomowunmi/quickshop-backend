import { IsString, MinLength } from 'class-validator';

export class CompleteOrderDto {
  @IsString()
  @MinLength(1)
  pickup_code!: string;
}

