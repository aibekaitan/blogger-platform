import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { Command } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { BcryptService } from '../../../adapters/bcrypt.service';

export class LoginUserCommand extends Command<{
  accessToken: string;
  refreshToken: string;
}> {
  constructor(
    public readonly loginOrEmail: string,
    public readonly password: string,
    public readonly ip: string,
    public readonly title: string,
  ) {
    super();
  }
}
@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<
  LoginUserCommand,
  { accessToken: string; refreshToken: string }
> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(
    command: LoginUserCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { loginOrEmail, password } = command;

    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await this.bcryptService.checkPassword(
      password,
      user.passwordHash,
    );
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const userId = user._id.toString();
    const login = user.login;

    const accessToken = this.jwtService.sign(
      { userId, login },
      { expiresIn: '300s' },
    );
    const refreshToken = this.jwtService.sign({ userId, login }); // без expiresIn → используй default или из config

    // TODO: здесь upsert device/session если нужно

    return { accessToken, refreshToken };
  }
}
