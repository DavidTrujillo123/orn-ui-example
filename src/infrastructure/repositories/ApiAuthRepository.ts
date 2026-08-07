import { IAuthRepository } from '@/domain/repositories/IAuthRepository';
import { AuthToken, LoginCredentials } from '@/domain/entities/AuthToken';
import { User } from '@/domain/entities/User';
import { httpClient } from '../http/httpClient';

export class ApiAuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    return httpClient.post<AuthToken>('/auth/login', credentials);
  }

  async getProfile(token: string): Promise<User> {
    const rawData = await httpClient.get<any>('/auth/profile', token);
    let avatar = rawData.avatar || '';
    avatar = avatar.replace(/[\[\]"]/g, '');
    if (!avatar.startsWith('http')) {
      avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Profile';
    }
    return {
      ...rawData,
      avatar,
    };
  }
}
