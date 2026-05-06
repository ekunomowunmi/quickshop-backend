import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { GeocodingService } from '../common/geocoding/geocoding.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store, User, Product])],
  controllers: [StoresController],
  providers: [StoresService, GeocodingService],
})
export class StoresModule {}

