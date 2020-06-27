import { inject, injectable } from 'tsyringe';
import { classToClass } from 'class-transformer';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}
interface IRequest {
  customer_id: string;
  products: IProduct[];
}
@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const productsIds = products.map(product => ({ id: product.id }));

    const requestedProducts = await this.productsRepository.findAllById(
      productsIds,
    );

    const productsWithData = products.map(product => {
      const productData = requestedProducts.find(
        requestedProduct => requestedProduct.id === product.id,
      );

      if (!productData) {
        throw new AppError('Product not found!');
      }

      if (productData.quantity < product.quantity) {
        throw new AppError('Invalid amount of product');
      }

      return {
        ...productData,
        quantity: product.quantity,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsWithData,
    });

    await this.productsRepository.updateQuantity(products);

    delete order.customer.created_at;
    delete order.customer.updated_at;

    return classToClass(order);
  }
}

export default CreateOrderService;
