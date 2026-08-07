import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { User, CreateUserInput } from '@/domain/entities/User';
import { httpClient } from '../http/httpClient';

const sanitizeAvatar = (img: string): string => {
  if (!img) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=PlatziUser';
  let clean = img.replace(/[\[\]"]/g, '');
  if (!clean.startsWith('http')) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=PlatziUser';
  return clean;
};

export class ApiUserRepository implements IUserRepository {
  async getUsers(limit = 20): Promise<User[]> {
    const rawData = await httpClient.get<any[]>(`/users?limit=${limit}`);
    return rawData.map((u) => ({
      ...u,
      avatar: sanitizeAvatar(u.avatar),
    }));
  }

  async getUserById(id: number): Promise<User> {
    const rawData = await httpClient.get<any>(`/users/${id}`);
    return {
      ...rawData,
      avatar: sanitizeAvatar(rawData.avatar),
    };
  }

  async createUser(data: CreateUserInput): Promise<User> {
    const rawData = await httpClient.post<any>('/users/', data);
    return {
      ...rawData,
      avatar: sanitizeAvatar(rawData.avatar),
    };
  }
}
