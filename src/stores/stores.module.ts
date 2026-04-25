import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store, User])],
  controllers: [StoresController],
  providers: [StoresService],
})
export class StoresModule {}

