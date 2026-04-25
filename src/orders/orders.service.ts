import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { FulfillmentType, Order, OrderStatus, PaymentMethod } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { User } from '../users/user.entity';
import { Store } from '../stores/store.entity';
import { Product } from '../products/product.entity';

function generatePickupCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function toCents(price: string): bigint {
  // price is a decimal string like "45000.00"
  const [whole, frac = ''] = price.split('.');
  const frac2 = (frac + '00').slice(0, 2);
  const sign = whole.startsWith('-') ? -1n : 1n;
  const w = BigInt(whole.replace('-', '') || '0');
  const f = BigInt(frac2.replace('-', '') || '0');
  return sign * (w * 100n + f);
}

function centsToDecimalString(cents: bigint): string {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const whole = abs / 100n;
  const frac = abs % 100n;
  const s = `${whole}.${frac.toString().padStart(2, '0')}`;
  return negative ? `-${s}` : s;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Store)
    private readonly storesRepo: Repository<Store>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async getById(id: string) {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: CreateOrderDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('items must not be empty');
    }

    const user = await this.usersRepo.findOne({
      where: { id: dto.user_id },
      select: { id: true },
    });
    if (!user) throw new BadRequestException('user_id does not exist');

    const store = await this.storesRepo.findOne({
      where: { id: dto.store_id },
      select: {
        id: true,
        deliveryAvailable: true,
        baseDeliveryFee: true,
        perKmFee: true,
      },
    });
    if (!store) throw new BadRequestException('store_id does not exist');

    const productIds = dto.items.map((i) => i.product_id);
    const products = await this.productsRepo.find({
      where: { id: In(productIds) },
      select: {
        id: true,
        storeId: true,
        price: true,
        stock: true,
        isAvailable: true,
      },
    });

    const byId = new Map(products.map((p) => [p.id, p]));

    // Validate each item
    let totalCents = 0n;
    for (const item of dto.items) {
      const product = byId.get(item.product_id);
      if (!product) {
        throw new BadRequestException(`product_id not found: ${item.product_id}`);
      }
      if (product.storeId !== dto.store_id) {
        throw new BadRequestException(`product does not belong to store: ${item.product_id}`);
      }
      if (!product.isAvailable) {
        throw new BadRequestException(`product is not available: ${item.product_id}`);
      }
      if (product.stock < item.quantity) {
        throw new ConflictException(`insufficient stock for product: ${item.product_id}`);
      }

      totalCents += toCents(product.price) * BigInt(item.quantity);
    }

    let deliveryFeeCents: bigint | null = null;
    let deliveryAddress: string | null = null;
    let deliveryLat: number | null = null;
    let deliveryLng: number | null = null;

    if (dto.fulfillment_type === FulfillmentType.DELIVERY) {
      if (!store.deliveryAvailable) {
        throw new BadRequestException('Store does not offer delivery');
      }

      if (dto.payment_method !== PaymentMethod.ONLINE) {
        throw new BadRequestException('Delivery orders must use payment_method = ONLINE');
      }

      if (!Number.isFinite(dto.delivery_lat) || !Number.isFinite(dto.delivery_lng)) {
        throw new BadRequestException('delivery_lat and delivery_lng are required for DELIVERY');
      }

      if (store.baseDeliveryFee == null || store.perKmFee == null) {
        throw new BadRequestException('Store delivery fees are not configured');
      }

      const [{ distance_meters }] = await this.storesRepo.query(
        `
        SELECT
          ST_Distance(
            s.location,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          )::float8 AS distance_meters
        FROM stores s
        WHERE s.id = $3
        `,
        [dto.delivery_lng, dto.delivery_lat, dto.store_id],
      );

      const meters = Number(distance_meters);
      if (!Number.isFinite(meters)) {
        throw new BadRequestException('Failed to calculate delivery distance');
      }

      const distanceKm = meters / 1000;
      const base = Number(store.baseDeliveryFee);
      const perKm = Number(store.perKmFee);
      if (!Number.isFinite(base) || !Number.isFinite(perKm) || base < 0 || perKm < 0) {
        throw new BadRequestException('Invalid store delivery fee configuration');
      }

      let fee = base + distanceKm * perKm;
      fee = Math.min(fee, 5000);

      deliveryFeeCents = BigInt(Math.round(fee * 100));
      totalCents += deliveryFeeCents;

      deliveryAddress = dto.delivery_address ?? null;
      deliveryLat = dto.delivery_lat ?? null;
      deliveryLng = dto.delivery_lng ?? null;
    } else {
      // PICKUP flow: delivery fields must be null
      deliveryFeeCents = null;
      deliveryAddress = null;
      deliveryLat = null;
      deliveryLng = null;
    }

    const pickupCode = generatePickupCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        userId: dto.user_id,
        storeId: dto.store_id,
        status: OrderStatus.PLACED,
        fulfillmentType: dto.fulfillment_type,
        totalAmount: centsToDecimalString(totalCents),
        deliveryFee: deliveryFeeCents == null ? null : centsToDecimalString(deliveryFeeCents),
        deliveryAddress,
        deliveryLat: deliveryLat == null ? null : deliveryLat.toFixed(6),
        deliveryLng: deliveryLng == null ? null : deliveryLng.toFixed(6),
        paymentMethod: dto.payment_method,
        pickupCode,
        expiresAt,
      });

      const savedOrder = await manager.save(Order, order);

      const orderItems = dto.items.map((i) => {
        const product = byId.get(i.product_id)!;
        return manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: i.product_id,
          quantity: i.quantity,
          price: product.price, // snapshot
        });
      });

      await manager.save(OrderItem, orderItems);

      // IMPORTANT: fetch using the same transaction manager, otherwise the row
      // may not be visible until the transaction commits.
      const created = await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: { items: true },
      });

      if (!created) {
        throw new NotFoundException('Order not found');
      }

      return created;
    });
  }

  private async setStatus(id: string, status: OrderStatus) {
    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const current = order.status;

    // Enforce a simple, safe state machine for MVP.
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
      [OrderStatus.ACCEPTED]: [OrderStatus.READY, OrderStatus.REJECTED, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.REJECTED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.EXPIRED]: [],
    };

    if (!allowed[current].includes(status)) {
      throw new BadRequestException(
        `Invalid status transition: ${current} -> ${status}`,
      );
    }

    order.status = status;
    await this.ordersRepo.save(order);
    return this.getById(id);
  }

  accept(id: string) {
    return this.setStatus(id, OrderStatus.ACCEPTED);
  }

  reject(id: string) {
    return this.setStatus(id, OrderStatus.REJECTED);
  }

  ready(id: string) {
    return this.setStatus(id, OrderStatus.READY);
  }

  async complete(id: string, dto: CompleteOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        relations: { items: true },
      });

      if (!order) throw new NotFoundException('Order not found');

      if (order.status === OrderStatus.COMPLETED) {
        return order;
      }

      if (order.pickupCode !== dto.pickup_code) {
        throw new BadRequestException('Invalid pickup_code');
      }

      if (order.status !== OrderStatus.READY) {
        throw new BadRequestException('Order must be READY to complete');
      }

      const productIds = order.items.map((i) => i.productId);
      const products = await manager.find(Product, {
        where: { id: In(productIds) },
        lock: { mode: 'pessimistic_write' },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      for (const item of order.items) {
        const p = byId.get(item.productId);
        if (!p) throw new BadRequestException(`product not found: ${item.productId}`);
        if (p.stock < item.quantity) {
          throw new ConflictException(`insufficient stock for product: ${item.productId}`);
        }
      }

      // Reduce stock
      for (const item of order.items) {
        const p = byId.get(item.productId)!;
        p.stock = p.stock - item.quantity;
      }
      await manager.save(Product, Array.from(byId.values()));

      order.status = OrderStatus.COMPLETED;
      await manager.save(Order, order);

      return manager.findOne(Order, { where: { id }, relations: { items: true } });
    });
  }
}

