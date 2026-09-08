export interface LoginPayload {
  username: string;
  password?: string;
}

export interface UserSession {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  accessToken: string;
  email?: string;
  gender?: string;
  image?: string;
  refreshToken?: string;
}