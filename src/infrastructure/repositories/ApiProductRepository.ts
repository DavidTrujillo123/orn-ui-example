import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product, CreateProductInput, UpdateProductInput } from '@/domain/entities/Product';
import { httpClient } from '../http/httpClient';

const sanitizeImage = (img: string): string => {
  if (!img) return 'https://i.imgur.com/QkIa5tT.jpeg';
  let clean = img;
  try {
    if (clean.startsWith('[')) {
      const parsed = JSON.parse(clean);
      clean = parsed[0] || '';
    }
  } catch {
    // ignore parse error
  }
  clean = clean.replace(/[\[\]"]/g, '');
  if (!clean.startsWith('http')) {
    return 'https://i.imgur.com/QkIa5tT.jpeg';
  }
  return clean;
};

const mapProduct = (item: any): Product => ({
  ...item,
  images: Array.isArray(item.images)
    ? item.images.map(sanitizeImage)
    : [sanitizeImage(item.images)],
  category: item.category
    ? {
        ...item.category,
        image: sanitizeImage(item.category.image),
      }
    : { id: 0, name: 'Uncategorized', image: 'https://i.imgur.com/QkIa5tT.jpeg' },
});

export class ApiProductRepository implements IProductRepository {
  async getProducts(limit = 30, offset = 0): Promise<Product[]> {
    const rawData = await httpClient.get<any[]>(`/products?offset=${offset}&limit=${limit}`);
    return rawData.map(mapProduct);
  }

  async getProductById(id: number): Promise<Product> {
    const rawData = await httpClient.get<any>(`/products/${id}`);
    return mapProduct(rawData);
  }

  async createProduct(data: CreateProductInput): Promise<Product> {
    const rawData = await httpClient.post<any>('/products/', data);
    return mapProduct(rawData);
  }

  async updateProduct(id: number, data: UpdateProductInput): Promise<Product> {
    const rawData = await httpClient.put<any>(`/products/${id}`, data);
    return mapProduct(rawData);
  }

  async deleteProduct(id: number): Promise<boolean> {
    return httpClient.delete<boolean>(`/products/${id}`);
  }
}
