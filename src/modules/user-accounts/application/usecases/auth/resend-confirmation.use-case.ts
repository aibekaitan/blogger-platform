// resend-confirmation.command.ts
import { Command } from '@nestjs/cqrs';
// resend-confirmation.use-case.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { NodemailerService } from '../../../adapters/nodemailer.service';
import { emailExamples } from '../../../adapters/emailExamples';

export class ResendConfirmationCommand extends Command<void> {
  constructor(public readonly email: string) {
    super();
  }
}

@CommandHandler(ResendConfirmationCommand)
export class ResendConfirmationUseCase implements ICommandHandler<
  ResendConfirmationCommand,
  void
> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly nodemailerService: NodemailerService,
  ) {}

  async execute(command: ResendConfirmationCommand): Promise<void> {
    const { email } = command;

    const user = await this.usersRepository.findByLoginOrEmail(email);
    if (!user) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'User not found', field: 'email' }],
      });
    }

    if (user.emailConfirmation.isConfirmed) {
      throw new BadRequestException({
        errorsMessages: [
          { message: 'Email already confirmed', field: 'email' },
        ],
      });
    }

    const newCode = randomUUID();
    await this.usersRepository.updateConfirmationCode(user._id, newCode);

    await this.nodemailerService
      .sendEmail(email, newCode, emailExamples.registrationEmail)
      .catch((err) => console.error('Resend email error:', err));
  }
}
