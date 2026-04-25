import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Store } from '../stores/store.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from '../payments/payment.entity';

export enum OrderStatus {
  PLACED = 'PLACED',
  ACCEPTED = 'ACCEPTED',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (u) => u.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId!: string;

  @ManyToOne(() => Store, (s) => s.orders, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'order_status',
    default: OrderStatus.PLACED,
  })
  status!: OrderStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount!: string;

  @Column({ type: 'varchar', length: 64, name: 'pickup_code' })
  pickupCode!: string;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: false })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => OrderItem, (oi) => oi.order)
  items!: OrderItem[];

  @OneToMany(() => Payment, (p) => p.order)
  payments!: Payment[];
}

