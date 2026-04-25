import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const role =
      dto.role === UserRole.CUSTOMER || dto.role === UserRole.STORE_OWNER
        ? dto.role
        : undefined;

    if (!role) {
      throw new BadRequestException('role must be CUSTOMER or STORE_OWNER');
    }

    const existing = await this.usersRepo.findOne({
      where: { phone: dto.phone },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('phone already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = this.usersRepo.create({
        name: dto.name,
        phone: dto.phone,
        email: dto.email ?? null,
        passwordHash,
        role,
      });

      const saved = await this.usersRepo.save(user);

      // Never return password hash
      const { passwordHash: _, ...safe } = saved as any;
      return safe;
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ConflictException('phone already exists');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  findById(id: string) {
    return this.usersRepo.findOne({
      where: { id },
      select: { id: true, role: true, phone: true, email: true, name: true },
    });
  }

  findByPhoneWithPasswordHash(phone: string) {
    return this.usersRepo.findOne({
      where: { phone },
      select: { id: true, role: true, passwordHash: true },
    });
  }
}

