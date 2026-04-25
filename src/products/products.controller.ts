import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';
import { Public } from '../auth/public.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get('store/:storeId')
  @Public()
  async getByStore(@Param('storeId') storeId: string) {
    return this.productsService.getByStore(storeId);
  }
}

