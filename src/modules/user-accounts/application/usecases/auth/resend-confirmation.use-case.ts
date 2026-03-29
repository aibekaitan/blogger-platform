// resend-confirmation.use-case.ts / handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
// import { UsersRepository } from '../infrastructure/users.repository';  // ← твой репозиторий
import { NodemailerService } from '../../../adapters/nodemailer.service';
import { emailExamples } from '../../../adapters/emailExamples';
import { UsersRepository } from '../../../infrastructure/users.repository';
// resend-confirmation.command.ts (без изменений)
export class ResendConfirmationCommand {
  constructor(public readonly email: string) {}
}
@Injectable()
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

    // 1. Находим пользователя (твой метод уже case-insensitive? — если нет → подправь)
    const user = await this.usersRepository.findByLoginOrEmail(email);

    if (!user) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'User not found', field: 'email' }],
      });
    }

    // 2. Проверяем, подтверждён ли уже email
    // Предполагаем, что emailConfirmation — это объект в raw-результате
    const confirmation = user.emailConfirmation as any; // или типизируй лучше

    if (confirmation?.isConfirmed === true) {
      throw new BadRequestException({
        errorsMessages: [
          { message: 'Email already confirmed', field: 'email' },
        ],
      });
    }

    // 3. Генерируем новый код
    const newCode = randomUUID();

    // 4. Обновляем код (используем готовый метод из репозитория!)
    await this.usersRepository.updateConfirmationCode(user.id, newCode);

    // 5. Отправляем письмо (не бросаем ошибку, если упадёт — пользователь уже получил код)
    await this.nodemailerService.sendEmail(email, newCode).catch((err) => {
      console.error('Resend confirmation email failed:', err);
      // Можно добавить метрику / лог в sentry / elk, но не прерывать use-case
    });
  }
}
