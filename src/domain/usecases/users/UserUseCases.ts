import { IUserRepository } from '../../repositories/IUserRepository';
import { User, CreateUserInput } from '../../entities/User';

export class UserUseCases {
  constructor(private userRepo: IUserRepository) {}

  async getUsers(limit = 20): Promise<User[]> {
    return this.userRepo.getUsers(limit);
  }

  async createUser(input: CreateUserInput): Promise<User> {
    return this.userRepo.createUser(input);
  }
}
