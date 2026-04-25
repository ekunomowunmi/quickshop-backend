import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoresService } from './stores.service';
import { Public } from '../auth/public.decorator';
import { UpdateStoreDto } from './dto/update-store.dto';
import type { Request } from 'express';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  async createStore(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  @Get('my')
  async myStores(@Req() req: Request) {
    const user = req.user as any;
    return this.storesService.myStores(user?.userId);
  }

  @Get(':storeId/products')
  async storeProductsForOwner(
    @Param('storeId') storeId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.storesService.storeProductsForOwner(storeId, user?.userId);
  }

  @Patch(':id')
  async updateStore(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateStoreDto,
  ) {
    const user = req.user as any;
    return this.storesService.update(id, user?.userId, dto);
  }

  @Delete(':id')
  async deleteStore(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.storesService.softDelete(id, user?.userId);
  }

  @Get('nearby')
  @Public()
  async getNearbyStores(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    return this.storesService.nearby(Number(lat), Number(lng));
  }
}

