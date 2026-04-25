import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Point } from 'geojson';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';

@Entity({ name: 'stores' })
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId!: string;

  @ManyToOne(() => User, (u) => u.stores, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  phone!: string;

  @Column({ type: 'text' })
  address!: string;

  @Index('idx_stores_location', { spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: Point;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', name: 'delivery_available', default: false })
  deliveryAvailable!: boolean;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'base_delivery_fee', nullable: true })
  baseDeliveryFee!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'per_km_fee', nullable: true })
  perKmFee!: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => Product, (p) => p.store)
  products!: Product[];

  @OneToMany(() => Order, (o) => o.store)
  orders!: Order[];
}

