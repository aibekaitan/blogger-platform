// src/security-devices/infrastructure/security-devices.query.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceDBWithId } from '../../types/devices.dto';
import { Device, DeviceDocument } from '../../domain/device.model';
import { DeviceViewModel } from '../../domain/dto/view-dto';



@Injectable()
export class SecurityDevicesQueryRepository {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  private mapToViewModel(device: DeviceDBWithId): DeviceViewModel {
    return {
      ip: device.ip,
      title: device.title,
      lastActiveDate: device.lastActiveDate.toISOString(),
      deviceId: device.deviceId,
    };
  }

  async findAllByUserId(userId: string): Promise<DeviceViewModel[]> {
    const devices = await this.deviceModel
      .find({ userId })
      .sort({ lastActiveDate: -1 })
      .select('-__v')
      .lean();

    return devices.map(this.mapToViewModel);
  }

  async findByDeviceId(deviceId: string): Promise<DeviceViewModel | null> {
    const device = await this.deviceModel
      .findOne({ deviceId })
      .select('-__v')
      .lean();

    if (!device) {
      return null;
    }

    return this.mapToViewModel(device);
  }

  async existsByDeviceId(deviceId: string): Promise<boolean> {
    // countDocuments с limit: 1 — эффективный способ проверить существование
    const count = await this.deviceModel
      .countDocuments({ deviceId }, { limit: 1 })
      .exec();

    return count > 0;
  }
}