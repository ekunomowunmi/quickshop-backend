import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Store } from '../stores/store.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Store)
    private readonly storesRepo: Repository<Store>,
  ) {}

  async create(dto: CreateProductDto) {
    const store = await this.storesRepo.findOne({
      where: { id: dto.store_id },
      select: { id: true },
    });

    if (!store) {
      throw new BadRequestException('store_id does not exist');
    }

    try {
      const product = this.productsRepo.create({
        storeId: dto.store_id,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price.toFixed(2),
        stock: dto.stock,
        imageUrl: dto.image_url ?? null,
        isAvailable: true,
      });

      const saved = await this.productsRepo.save(product);
      return saved;
    } catch (err) {
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async getByStore(storeId: string) {
    const store = await this.storesRepo.findOne({
      where: { id: storeId },
      select: { id: true },
    });

    if (!store) {
      throw new BadRequestException('storeId does not exist');
    }

    return this.productsRepo.find({
      where: { storeId, isAvailable: true },
      order: { createdAt: 'DESC' },
    });
  }
}

