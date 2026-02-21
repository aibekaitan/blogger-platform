import { Command } from '@nestjs/cqrs';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { NodemailerService } from '../../../adapters/nodemailer.service';
import { emailExamples } from '../../../adapters/emailExamples';

export class PasswordRecoveryCommand extends Command<void> {
  constructor(public readonly email: string) {
    super();
  }
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryUseCase implements ICommandHandler<
  PasswordRecoveryCommand,
  void
> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly nodemailerService: NodemailerService,
  ) {}

  async execute(command: PasswordRecoveryCommand): Promise<void> {
    const { email } = command;

    const user = await this.usersRepository.findByLoginOrEmail(email);
    if (!user) {
      return; // silently ignore — как в твоём оригинальном коде
    }

    const recoveryCode = randomUUID();
    await this.usersRepository.updatePasswordRecoveryCode(
      user._id,
      recoveryCode,
    );

    await this.nodemailerService
      .sendEmail(email, recoveryCode, emailExamples.passwordRecoveryEmail)
      .catch((err) => console.error('Recovery email error:', err));
  }
}
