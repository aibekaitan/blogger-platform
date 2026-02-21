import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { Command } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { BcryptService } from '../../../adapters/bcrypt.service';
import { NodemailerService } from '../../../adapters/nodemailer.service';
import { User } from '../../../domain/user.entity';
import { emailExamples } from '../../../adapters/emailExamples';

export class RegisterUserCommand extends Command<void> {
  constructor(
    public readonly login: string,
    public readonly password: string,
    public readonly email: string,
  ) {
    super();
  }
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase implements ICommandHandler<
  RegisterUserCommand,
  void
> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
    private readonly nodemailerService: NodemailerService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<void> {
    const { login, password, email } = command;

    if (await this.usersRepository.findByLogin(login)) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'Login already exists', field: 'login' }],
      });
    }
    if (await this.usersRepository.findByEmail(email)) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'Email already exists', field: 'email' }],
      });
    }

    const passwordHash = await this.bcryptService.generateHash(password);
    const confirmationCode = randomUUID();
    const expirationDate = new Date(Date.now() + 60 * 60 * 1000);

    const dto = { id: uuidv4(), login, email, passwordHash };
    const newUser = User.createInstance(dto);
    newUser.emailConfirmation = {
      confirmationCode,
      expirationDate,
      isConfirmed: false,
    };

    await this.usersRepository.create(newUser);

    await this.nodemailerService
      .sendEmail(email, confirmationCode, emailExamples.registrationEmail)
      .catch(console.error);
  }
}
