// src/security-devices/infrastructure/security-devices.query.repository.ts

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DeviceViewModel } from '../../domain/dto/view-dto';

@Injectable()
export class SecurityDevicesQueryRepository {
  constructor(private readonly dataSource: DataSource) {}

  private mapToViewModel(row: any): DeviceViewModel {
    return {
      ip: row.ip,
      title: row.title,
      lastActiveDate: new Date(row.lastActiveDate).toISOString(),
      deviceId: row.deviceId,
    };
  }

  async findAllByUserId(userId: string): Promise<DeviceViewModel[]> {
    const rows = await this.dataSource.query(
      `
      SELECT 
        ip,
        title,
        "lastActiveDate",
        "deviceId"
      FROM devices
      WHERE "userId" = $1
      ORDER BY "lastActiveDate" DESC
      `,
      [userId],
    );

    return rows.map((row) => this.mapToViewModel(row));
  }

  async findByDeviceId(deviceId: string): Promise<DeviceViewModel | null> {
    const [row] = await this.dataSource.query(
      `
      SELECT 
        ip,
        title,
        "lastActiveDate",
        "deviceId"
      FROM devices
      WHERE "deviceId" = $1
      LIMIT 1
      `,
      [deviceId],
    );

    if (!row) {
      return null;
    }

    return this.mapToViewModel(row);
  }

  async existsByDeviceId(deviceId: string): Promise<boolean> {
    const [result] = await this.dataSource.query(
      `
      SELECT EXISTS (
        SELECT 1 
        FROM devices 
        WHERE "deviceId" = $1
        LIMIT 1
      ) AS "exists"
      `,
      [deviceId],
    );

    return result?.exists === true;
  }
}
