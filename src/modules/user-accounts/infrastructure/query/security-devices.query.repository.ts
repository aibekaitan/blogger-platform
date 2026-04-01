import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../../domain/device.model';
import { DeviceViewModel } from '../../domain/dto/view-dto';

@Injectable()
export class SecurityDevicesQueryRepository {
  constructor(
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
  ) {}

  private mapToViewModel(device: Device): DeviceViewModel {
    return {
      ip: device.ip,
      title: device.title,
      lastActiveDate: device.lastActiveDate.toISOString(),
      deviceId: device.deviceId,
    };
  }

  async findAllByUserId(userId: string): Promise<DeviceViewModel[]> {
    const devices = await this.devicesRepository.find({
      where: { userId },
      order: { lastActiveDate: 'DESC' },
    });

    return devices.map((device) => this.mapToViewModel(device));
  }

  async findByDeviceId(deviceId: string): Promise<DeviceViewModel | null> {
    const device = await this.devicesRepository.findOneBy({ deviceId });

    if (!device) {
      return null;
    }

    return this.mapToViewModel(device);
  }

  async existsByDeviceId(deviceId: string): Promise<boolean> {
    const count = await this.devicesRepository.countBy({ deviceId });
    return count > 0;
  }
}

