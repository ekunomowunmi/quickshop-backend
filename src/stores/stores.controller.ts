import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoresService } from './stores.service';
import { Public } from '../auth/public.decorator';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  async createStore(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
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

