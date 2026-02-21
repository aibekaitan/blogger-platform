// change-password.command.ts

// change-password.use-case.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { Command } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { BcryptService } from '../../../adapters/bcrypt.service';

export class ChangePasswordCommand extends Command<void> {
  constructor(
    public readonly recoveryCode: string,
    public readonly newPassword: string,
  ) {
    super();
  }
}
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordUseCase implements ICommandHandler<
  ChangePasswordCommand,
  void
> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const { recoveryCode, newPassword } = command;

    const user =
      await this.usersRepository.findUserByPasswordRecoveryCode(recoveryCode);
    if (!user) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'Incorrect or expired recovery code',
            field: 'recoveryCode',
          },
        ],
      });
    }

    const passwordHash = await this.bcryptService.generateHash(newPassword);
    await this.usersRepository.updatePassword(user._id, passwordHash);
  }
}
