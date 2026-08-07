export interface AuthToken {
  access_token: string;
  refresh_token: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}
