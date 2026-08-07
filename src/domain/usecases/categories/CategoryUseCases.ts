import { ICategoryRepository } from '../../repositories/ICategoryRepository';
import { Category } from '../../entities/Category';
import { Product } from '../../entities/Product';

export class CategoryUseCases {
  constructor(private categoryRepo: ICategoryRepository) {}

  async getCategories(): Promise<Category[]> {
    return this.categoryRepo.getCategories();
  }

  async getCategoryProducts(categoryId: number): Promise<Product[]> {
    return this.categoryRepo.getCategoryProducts(categoryId);
  }
}
