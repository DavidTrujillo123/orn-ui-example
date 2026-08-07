import { IProductRepository } from '../../repositories/IProductRepository';
import { Product, CreateProductInput } from '../../entities/Product';

export class ProductUseCases {
  constructor(private productRepo: IProductRepository) {}

  async getProducts(limit = 30, offset = 0): Promise<Product[]> {
    return this.productRepo.getProducts(limit, offset);
  }

  async getProductById(id: number): Promise<Product> {
    return this.productRepo.getProductById(id);
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    return this.productRepo.createProduct(input);
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.productRepo.deleteProduct(id);
  }
}
