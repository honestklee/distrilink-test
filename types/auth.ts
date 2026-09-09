export type UserRole = 'supervisor' | 'salesman';

export interface LoginPayload {
  username: string;
  password?: string;
  role?: UserRole;
}

export interface UserSession {
  id: number | string;
  username: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  role: UserRole;
  area: string; // Wilayah penugasan (Bandung Kota, Bandung Barat, Cimahi, dll)
  salesmanId?: string;
  email?: string;
  gender?: string;
  image?: string;
  refreshToken?: string;
}