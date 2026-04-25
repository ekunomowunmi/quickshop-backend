import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    // Delegates phone uniqueness + hashing to UsersService (no duplication)
    const user = await this.usersService.create(dto);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    return {
      access_token: accessToken,
      user: { id: user.id, role: user.role },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByPhoneWithPasswordHash(dto.phone);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    return {
      access_token: accessToken,
      user: { id: user.id, role: user.role },
    };
  }
}

