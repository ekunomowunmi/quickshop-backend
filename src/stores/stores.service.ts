import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { User, UserRole } from '../users/user.entity';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepo: Repository<Store>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateStoreDto) {
    const { ownerId, name, phone, address, latitude, longitude } = dto;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('latitude and longitude must be valid numbers');
    }

    const owner = await this.usersRepo.findOne({
      where: { id: ownerId },
      select: { id: true, role: true },
    });

    if (!owner) {
      throw new BadRequestException('ownerId does not exist');
    }

    if (owner.role !== UserRole.STORE_OWNER) {
      throw new ForbiddenException('Only STORE_OWNER users can create stores');
    }

    try {
      const result = await this.storesRepo
        .createQueryBuilder()
        .insert()
        .into(Store)
        .values({
          name,
          phone,
          address,
          ownerId,
          location: () =>
            'ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography',
        })
        .setParameters({ lat: latitude, lng: longitude })
        .returning('*')
        .execute();

      return result.raw?.[0];
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ConflictException('Store with same unique field already exists');
      }
      if (err?.code === '23503') {
        throw new BadRequestException(
          'Invalid owner_id. ownerId must reference an existing user.',
        );
      }
      throw new InternalServerErrorException('Failed to create store');
    }
  }

  // async nearby(lat: number, lng: number) {
  //   if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
  //     throw new BadRequestException('lat and lng must be valid numbers');
  //   }

  //   // Use raw SQL to leverage the <-> KNN operator on PostGIS geography.
  //   const rows = await this.storesRepo.query(
  //     `
  //     SELECT
  //       s.*,
  //       ST_Distance(
  //         s.location,
  //         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
  //       ) AS distance_meters
  //     FROM stores s
  //     ORDER BY s.location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
  //     `,
  //     [lng, lat],
  //   );

  //   return rows;
  // }

  async nearby(lat: number, lng: number) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new BadRequestException('lat and lng must be valid numbers');
    }
  
    const rows = await this.storesRepo.query(
      `
      SELECT
        s.*,
        ST_Distance(
          s.location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) AS distance_meters
      FROM stores s
      WHERE s.is_active = true
      AND ST_DWithin(
        s.location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        5000
      )
      ORDER BY s.location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      LIMIT 20
      `,
      [lng, lat],
    );
    
  
    return rows;
  }

  async update(storeId: string, currentUserId: string, dto: UpdateStoreDto) {
    const store = await this.storesRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    if (!currentUserId || store.ownerId !== currentUserId) {
      throw new ForbiddenException('You do not own this store');
    }

    if (dto.name !== undefined) store.name = dto.name;
    if (dto.phone !== undefined) store.phone = dto.phone;
    if (dto.address !== undefined) store.address = dto.address;

    // Delivery settings
    if (dto.delivery_available !== undefined) {
      store.deliveryAvailable = dto.delivery_available;
    }
    if (dto.base_delivery_fee !== undefined) {
      store.baseDeliveryFee = dto.base_delivery_fee.toFixed(2);
    }
    if (dto.per_km_fee !== undefined) {
      store.perKmFee = dto.per_km_fee.toFixed(2);
    }

    return this.storesRepo.save(store);
  }

  async softDelete(storeId: string, currentUserId: string) {
    const store = await this.storesRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    if (!currentUserId || store.ownerId !== currentUserId) {
      throw new ForbiddenException('You do not own this store');
    }

    store.isActive = false;
    return this.storesRepo.save(store);
  }
}

