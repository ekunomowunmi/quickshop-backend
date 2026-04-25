import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from '../stores/store.entity';
import { Order } from '../orders/order.entity';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  STORE_OWNER = 'STORE_OWNER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', unique: true })
  phone!: string;

  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @Column({ type: 'text', name: 'password_hash' })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
    default: UserRole.CUSTOMER,
  })
  role!: UserRole;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Store, (s) => s.owner)
  stores!: Store[];

  @OneToMany(() => Order, (o) => o.user)
  orders!: Order[];
}

