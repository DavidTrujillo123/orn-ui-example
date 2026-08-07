export interface User {
  id: number;
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'customer';
  avatar: string;
  creationAt?: string;
  updatedAt?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  avatar: string;
  role?: 'admin' | 'customer';
}
