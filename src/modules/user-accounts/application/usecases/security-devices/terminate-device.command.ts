import { Command } from '@nestjs/cqrs';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../infrastructure/security-devices/security-devices.repository';
import { ServiceResult } from '../../../../../common/result/result.type';
import { ResultStatus } from '../../../../../common/result/resultCode';

export class TerminateDeviceCommand extends Command<ServiceResult> {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {
    super();
  }
}
@CommandHandler(TerminateDeviceCommand)
export class TerminateDeviceHandler implements ICommandHandler<
  TerminateDeviceCommand,
  ServiceResult
> {
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(command: TerminateDeviceCommand): Promise<ServiceResult> {
    const { userId, deviceId } = command;

    const device = await this.devicesRepository.findByDeviceId(deviceId);

    if (!device) {
      return {
        status: ResultStatus.NotFound,
        extensions: [{ message: 'Device not found', field: 'deviceId' }],
      };
    }

    if (device.userId !== userId) {
      return {
        status: ResultStatus.Forbidden,
        extensions: [{ message: 'Forbidden: device belongs to another user' }],
      };
    }

    await this.devicesRepository.deleteByDeviceId(deviceId);

    return { status: ResultStatus.Success };
  }
}
