import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DeviceDB, DeviceDBWithId } from '../../types/devices.dto';

@Injectable()
export class DevicesRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findAllByUserId(userId: string): Promise<DeviceDBWithId[]> {
    const result = await this.dataSource.query(
      `
      SELECT 
        id,
        "userId",
        "deviceId",
        ip,
        title,
        "lastActiveDate",
        "expirationDate",
        "refreshToken"
      FROM devices
      WHERE "userId" = $1
      ORDER BY "lastActiveDate" DESC
      `,
      [userId],
    );

    return result as DeviceDBWithId[];
  }

  async findByDeviceId(deviceId: string): Promise<DeviceDBWithId | null> {
    const [result] = await this.dataSource.query(
      `
      SELECT 
        id,
        "userId",
        "deviceId",
        ip,
        title,
        "lastActiveDate",
        "expirationDate",
        "refreshToken"
      FROM devices
      WHERE "deviceId" = $1
      LIMIT 1
      `,
      [deviceId],
    );

    return result || null;
  }


  async upsertDevice(
    deviceData: Omit<DeviceDB, 'id'>,
  ): Promise<DeviceDBWithId> {
    const {
      userId,
      deviceId,
      ip,
      title,
      lastActiveDate,
      expirationDate,
      refreshToken,
    } = deviceData;

    const [updated] = await this.dataSource.query(
      `
      INSERT INTO devices (
        "userId", 
        "deviceId", 
        ip, 
        title, 
        "lastActiveDate", 
        "expirationDate", 
        "refreshToken"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT ("deviceId") 
      DO UPDATE SET
        ip = EXCLUDED.ip,
        title = EXCLUDED.title,
        "lastActiveDate" = EXCLUDED."lastActiveDate",
        "expirationDate" = EXCLUDED."expirationDate",
        "refreshToken" = EXCLUDED."refreshToken",
        "userId" = EXCLUDED."userId"
      RETURNING 
        id,
        "userId",
        "deviceId",
        ip,
        title,
        "lastActiveDate",
        "expirationDate",
        "refreshToken"
      `,
      [
        userId,
        deviceId,
        ip,
        title,
        lastActiveDate,
        expirationDate,
        refreshToken,
      ],
    );

    if (!updated) {
      throw new Error('Failed to upsert device');
    }

    return updated as DeviceDBWithId;
  }

  async deleteByDeviceId(deviceId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `DELETE FROM devices WHERE "deviceId" = $1`,
      [deviceId],
    );

    return (result[1] as number) === 1;
  }

  async deleteAllExceptCurrent(
    userId: string,
    currentDeviceId: string,
  ): Promise<number> {
    const result = await this.dataSource.query(
      `
      DELETE FROM devices 
      WHERE "userId" = $1 
      AND "deviceId" != $2
      `,
      [userId, currentDeviceId],
    );

    return result[1] as number;
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.dataSource.query(
      `DELETE FROM devices WHERE "userId" = $1`,
      [userId],
    );

    return result[1] as number;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.dataSource.query(
      `DELETE FROM devices WHERE "expirationDate" < NOW()`,
    );

    return result[1] as number;
  }

  async updateLastActiveDate(
    deviceId: string,
    newDate: Date = new Date(),
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `
      UPDATE devices 
      SET "lastActiveDate" = $1 
      WHERE "deviceId" = $2
      `,
      [newDate, deviceId],
    );

    return (result[1] as number) === 1;
  }
}
