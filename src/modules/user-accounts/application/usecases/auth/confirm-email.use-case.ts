import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { Command } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';

export class ConfirmEmailCommand extends Command<void> {
  constructor(public readonly code: string) {
    super();
  }
}

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailUseCase implements ICommandHandler<
  ConfirmEmailCommand,
  void
> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: ConfirmEmailCommand): Promise<void> {
    const { code } = command;

    const user = await this.usersRepository.findUserByConfirmationCode(code);
    if (!user) {
      throw new BadRequestException({
        errorsMessages: [
          { message: 'Incorrect or expired code', field: 'code' },
        ],
      });
    }

    if (user.emailConfirmation.isConfirmed) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'Code already confirmed', field: 'code' }],
      });
    }

    await this.usersRepository.updateConfirmation(user._id);
  }
}
