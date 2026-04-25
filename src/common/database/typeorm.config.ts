import * as dotenv from 'dotenv';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../../users/user.entity';
import { Store } from '../../stores/store.entity';
import { Product } from '../../products/product.entity';
import { Order } from '../../orders/order.entity';
import { OrderItem } from '../../orders/order-item.entity';
import { Payment } from '../../payments/payment.entity';

dotenv.config();

export function typeOrmConfig(): TypeOrmModuleOptions {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
  const username = process.env.DB_USER;
  const password = process.env.DB_PASS;
  const database = process.env.DB_NAME;

  if (!host || !port || !username || !password || !database) {
    throw new Error(
      'Missing database env vars. Required: DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME',
    );
  }

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: [User, Store, Product, Order, OrderItem, Payment],
    autoLoadEntities: true,
    synchronize: false,
    logging: ['error'],
  };
}

