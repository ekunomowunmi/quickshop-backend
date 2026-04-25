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

export enum FulfillmentType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export enum PaymentMethod {
  ONLINE = 'ONLINE',
  CASH = 'CASH',
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

  @Column({
    type: 'enum',
    enum: FulfillmentType,
    enumName: 'fulfillment_type',
    name: 'fulfillment_type',
    default: FulfillmentType.PICKUP,
  })
  fulfillmentType!: FulfillmentType;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'total_amount' })
  totalAmount!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'delivery_fee', nullable: true })
  deliveryFee!: string | null;

  @Column({ type: 'text', name: 'delivery_address', nullable: true })
  deliveryAddress!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 6, name: 'delivery_lat', nullable: true })
  deliveryLat!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 6, name: 'delivery_lng', nullable: true })
  deliveryLng!: string | null;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    enumName: 'payment_method',
    name: 'payment_method',
    default: PaymentMethod.ONLINE,
  })
  paymentMethod!: PaymentMethod;

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

