export interface JwtPayload {
  userId: string;
  deviceId: string;
  iat?: number;
  exp?: number;
  login: string;
}
