import { AuthToken, LoginCredentials } from '../entities/AuthToken';
import { User } from '../entities/User';

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthToken>;
  getProfile(token: string): Promise<User>;
}
