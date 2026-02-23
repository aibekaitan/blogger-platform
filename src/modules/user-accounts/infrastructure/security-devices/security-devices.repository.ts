// src/security-devices/infrastructure/security-devices.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Device, DeviceDocument } from '../../domain/device.model';
import { DeviceDB, DeviceDBWithId } from '../../types/devices.dto';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {}

  async findAllByUserId(userId: string): Promise<DeviceDBWithId[]> {
    return this.deviceModel
      .find({ userId })
      .sort({ lastActiveDate: -1 })
      .select('-__v')
      .lean();
  }

  async findByDeviceId(deviceId: string): Promise<DeviceDBWithId | null> {
    return this.deviceModel.findOne({ deviceId }).select('-__v').lean();
  }

  async upsertDevice(
    deviceData: Omit<DeviceDB, '_id'>,
  ): Promise<DeviceDBWithId> {
    const updatedDevice = await this.deviceModel
      .findOneAndUpdate(
        {
          userId: deviceData.userId,
          deviceId: deviceData.deviceId,
        },
        { $set: deviceData },
        {
          upsert: true, // создать, если не существует
          new: true, // вернуть обновлённый документ
          setDefaultsOnInsert: true, // применить default-значения из схемы
          projection: { __v: 0 }, // исключить __v
        },
      )
      .select('-__v') // дополнительно убрать __v
      .lean<DeviceDBWithId>() // типизируем как plain object
      .exec();

    if (!updatedDevice) {
      throw new Error('Failed to upsert device'); // редкий кейс, но на всякий
    }

    return updatedDevice;
  }

  async deleteByDeviceId(deviceId: string): Promise<boolean> {
    const result = await this.deviceModel.deleteOne({ deviceId });
    return result.deletedCount === 1;
  }

  async deleteAllExceptCurrent(
    userId: string,
    currentDeviceId: string,
  ): Promise<number> {
    const result = await this.deviceModel.deleteMany({
      userId,
      deviceId: { $ne: currentDeviceId },
    });
    return result.deletedCount;
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.deviceModel.deleteMany({ userId });
    return result.deletedCount;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.deviceModel.deleteMany({
      expirationDate: { $lt: new Date() },
    });
    return result.deletedCount;
  }

  async updateLastActiveDate(
    deviceId: string,
    newDate: Date = new Date(),
  ): Promise<boolean> {
    const result = await this.deviceModel.updateOne(
      { deviceId },
      { $set: { lastActiveDate: newDate } },
    );
    return result.modifiedCount === 1;
  }
}
