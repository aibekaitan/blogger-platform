import { WithId } from 'mongodb';

export interface DeviceDB {
  userId: string;
  deviceId: string;
  ip: string;
  title: string;
  lastActiveDate: Date;
  expirationDate: Date;
  refreshToken: string;
  // createdAt?: Date;
}
export type DeviceDBWithId = WithId<DeviceDB>;
