import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not } from 'typeorm';
import { Device } from '../../domain/device.model';
import { DeviceDB, DeviceDBWithId } from '../../types/devices.dto';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
  ) {}

  // async findAllByUserId(userId: string): Promise<DeviceDBWithId[]> {
  //   const devices = await this.devicesRepository.find({
  //     where: { userId },
  //     order: { lastActiveDate: 'DESC' },
  //   });
  //   return devices;
  // }

  async findByDeviceId(deviceId: string): Promise<Device | null> {
    const device = await this.devicesRepository.findOneBy({ deviceId });
    return device || null;
  }

  async upsertDevice(deviceData: Omit<DeviceDB, 'id'>): Promise<Device> {
    const {
      userId,
      deviceId,
      ip,
      title,
      lastActiveDate,
      expirationDate,
      refreshToken,
    } = deviceData;

    await this.devicesRepository.upsert(
      {
        userId,
        deviceId,
        ip,
        title,
        lastActiveDate,
        expirationDate,
        refreshToken,
      },
      ['deviceId'],
    );

    const updated = await this.devicesRepository.findOneBy({ deviceId });
    if (!updated) {
      throw new Error('Failed to upsert device');
    }

    return updated;
  }

  async deleteByDeviceId(deviceId: string): Promise<boolean> {
    const result = await this.devicesRepository.delete({ deviceId });
    return result.affected === 1;
  }

  async deleteAllExceptCurrent(
    userId: string,
    currentDeviceId: string,
  ): Promise<number> {
    const result = await this.devicesRepository.delete({
      userId,
      deviceId: Not(currentDeviceId),
    });
    return result.affected || 0;
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.devicesRepository.delete({ userId });
    return result.affected || 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.devicesRepository.delete({
      expirationDate: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  async updateLastActiveDate(
    deviceId: string,
    newDate: Date = new Date(),
  ): Promise<boolean> {
    const result = await this.devicesRepository.update(
      { deviceId },
      { lastActiveDate: newDate },
    );
    return result.affected === 1;
  }
}
