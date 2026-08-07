import { IAuthRepository } from '../../repositories/IAuthRepository';
import { AuthToken, LoginCredentials } from '../../entities/AuthToken';
import { User } from '../../entities/User';

export class AuthUseCases {
  constructor(private authRepo: IAuthRepository) {}

  async login(credentials: LoginCredentials): Promise<AuthToken> {
    return this.authRepo.login(credentials);
  }

  async getProfile(token: string): Promise<User> {
    return this.authRepo.getProfile(token);
  }
}
