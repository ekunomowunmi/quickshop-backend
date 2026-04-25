import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CompleteOrderDto } from './dto/complete-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.ordersService.getById(id);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.ordersService.accept(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.ordersService.reject(id);
  }

  @Patch(':id/ready')
  ready(@Param('id') id: string) {
    return this.ordersService.ready(id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteOrderDto) {
    return this.ordersService.complete(id, dto);
  }
}

