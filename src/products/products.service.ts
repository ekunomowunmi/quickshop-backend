import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Store } from '../stores/store.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

  async update(productId: string, currentUserId: string, dto: UpdateProductDto) {
    const product = await this.productsRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const store = await this.storesRepo.findOne({
      where: { id: product.storeId },
      select: { id: true, ownerId: true },
    });
    if (!store) throw new BadRequestException('Store not found for product');

    if (!currentUserId || store.ownerId !== currentUserId) {
      throw new ForbiddenException('You do not own this store');
    }

    // Only apply allowed fields (ignore store_id)
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description ?? null;
    if (dto.price !== undefined) product.price = Number(dto.price).toFixed(2);
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.image_url !== undefined) product.imageUrl = dto.image_url ?? null;
    if (dto.is_available !== undefined) product.isAvailable = dto.is_available;

    return this.productsRepo.save(product);
  }

  async softDelete(productId: string, currentUserId: string) {
    const product = await this.productsRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not found');

    const store = await this.storesRepo.findOne({
      where: { id: product.storeId },
      select: { id: true, ownerId: true },
    });
    if (!store) throw new BadRequestException('Store not found for product');

    if (!currentUserId || store.ownerId !== currentUserId) {
      throw new ForbiddenException('You do not own this store');
    }

    product.isAvailable = false;
    return this.productsRepo.save(product);
  }
}

