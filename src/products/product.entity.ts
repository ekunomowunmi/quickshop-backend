import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Store } from '../stores/store.entity';
import { OrderItem } from '../orders/order-item.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'store_id' })
  storeId!: string;

  @ManyToOne(() => Store, (s) => s.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @Column({ type: 'int' })
  stock!: number;

  @Column({ type: 'text', name: 'image_url', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'boolean', name: 'is_available', default: true })
  isAvailable!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => OrderItem, (oi) => oi.product)
  orderItems!: OrderItem[];
}

