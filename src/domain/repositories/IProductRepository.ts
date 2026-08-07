import { Product, CreateProductInput, UpdateProductInput } from '../entities/Product';

export interface IProductRepository {
  getProducts(limit?: number, offset?: number): Promise<Product[]>;
  getProductById(id: number): Promise<Product>;
  createProduct(data: CreateProductInput): Promise<Product>;
  updateProduct(id: number, data: UpdateProductInput): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
}
