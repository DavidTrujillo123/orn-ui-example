import { ICategoryRepository } from '@/domain/repositories/ICategoryRepository';
import { Category } from '@/domain/entities/Category';
import { Product } from '@/domain/entities/Product';
import { httpClient } from '../http/httpClient';

const sanitizeImage = (img: string): string => {
  if (!img) return 'https://i.imgur.com/QkIa5tT.jpeg';
  let clean = img.replace(/[\[\]"]/g, '');
  if (!clean.startsWith('http')) return 'https://i.imgur.com/QkIa5tT.jpeg';
  return clean;
};

export class ApiCategoryRepository implements ICategoryRepository {
  async getCategories(): Promise<Category[]> {
    const rawData = await httpClient.get<any[]>('/categories');
    return rawData.map((item) => ({
      ...item,
      image: sanitizeImage(item.image),
    }));
  }

  async getCategoryProducts(categoryId: number): Promise<Product[]> {
    const rawData = await httpClient.get<any[]>(`/categories/${categoryId}/products`);
    return rawData.map((item) => ({
      ...item,
      images: Array.isArray(item.images)
        ? item.images.map((img: string) => sanitizeImage(img))
        : [sanitizeImage(item.images)],
    }));
  }
}
