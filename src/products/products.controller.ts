import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';
import { Public } from '../auth/public.decorator';
import { UpdateProductDto } from './dto/update-product.dto';
import type { Request } from 'express';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateProductDto) {
    const user = req.user as any;
    return this.productsService.update(id, user?.userId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.productsService.softDelete(id, user?.userId);
  }

  @Get('store/:storeId')
  @Public()
  async getByStore(@Param('storeId') storeId: string) {
    return this.productsService.getByStore(storeId);
  }
}

