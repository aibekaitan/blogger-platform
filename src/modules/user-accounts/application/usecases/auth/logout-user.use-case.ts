// application/usecases/auth/logout-user.use-case.ts
// import { Command } from '@nestjs/cqrs';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../infrastructure/security-devices/security-devices.repository';

export class LogoutCommand {
  constructor(public readonly deviceId: string) {}
}
@CommandHandler(LogoutCommand)
export class LogoutUseCase implements ICommandHandler<LogoutCommand> {
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(command: LogoutCommand): Promise<void> {
    const { deviceId } = command;

    const deleted = await this.devicesRepository.deleteByDeviceId(deviceId);

    if (!deleted) {
      // throw new NotFoundException('Session not found');
    }
  }
}
