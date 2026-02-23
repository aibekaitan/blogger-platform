// application/commands/terminate-all-except-current.command.ts
import { Command } from '@nestjs/cqrs';

// application/handlers/terminate-all-except-current.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../infrastructure/security-devices/security-devices.repository';
import { ResultStatus } from '../../../../../common/result/resultCode';
import { ServiceResult } from '../../../../../common/result/result.type';

export class TerminateAllExceptCurrentCommand extends Command<ServiceResult> {
  constructor(
    public readonly userId: string,
    public readonly currentDeviceId: string,
  ) {
    super();
  }
}
@CommandHandler(TerminateAllExceptCurrentCommand)
export class TerminateAllExceptCurrentHandler implements ICommandHandler<
  TerminateAllExceptCurrentCommand,
  ServiceResult
> {
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(
    command: TerminateAllExceptCurrentCommand,
  ): Promise<ServiceResult> {
    const { userId, currentDeviceId } = command;

    await this.devicesRepository.deleteAllExceptCurrent(
      userId,
      currentDeviceId,
    );

    return { status: ResultStatus.Success };
  }
}
