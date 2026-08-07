import { User, CreateUserInput } from '../entities/User';

export interface IUserRepository {
  getUsers(limit?: number): Promise<User[]>;
  getUserById(id: number): Promise<User>;
  createUser(data: CreateUserInput): Promise<User>;
}
