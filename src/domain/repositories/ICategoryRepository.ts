import { Category } from '../entities/Category';
import { Product } from '../entities/Product';

export interface ICategoryRepository {
  getCategories(): Promise<Category[]>;
  getCategoryProducts(categoryId: number): Promise<Product[]>;
}
