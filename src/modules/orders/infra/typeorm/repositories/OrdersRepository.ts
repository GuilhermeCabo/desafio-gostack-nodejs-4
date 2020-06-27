import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import OrdersProducts from '@modules/orders/infra/typeorm/entities/OrdersProducts';
import Order from '../entities/Order';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order = this.ormRepository.create({
      customer,
    });

    order.order_products = products.map(product => {
      const order_products = new OrdersProducts();
      order_products.product_id = product.id;
      order_products.order_id = order.id;
      order_products.price = product.price;
      order_products.quantity = product.quantity;
      return order_products;
    });

    await this.ormRepository.save(order);

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const order = await this.ormRepository.findOne(id);

    return order;
  }
}

export default OrdersRepository;
