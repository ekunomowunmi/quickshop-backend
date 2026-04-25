import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { User, UserRole } from '../users/user.entity';

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
}

