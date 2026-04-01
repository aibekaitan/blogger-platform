import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Command } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { BcryptService } from '../../../adapters/bcrypt.service';
import { DevicesRepository } from '../../../infrastructure/security-devices/security-devices.repository';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constants';

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
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly accessTokenService: JwtService,
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenService: JwtService,
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
    private readonly devicesRepository: DevicesRepository,
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

    const userId = user.id.toString();
    const login = user.login;
    const deviceId = crypto.randomUUID();

    const accessToken = this.accessTokenService.sign({ userId, login });
    const refreshToken = this.refreshTokenService.sign({
      userId,
      login,
      deviceId,
    });

    await this.devicesRepository.upsertDevice({
      userId,
      deviceId,
      ip: command.ip,
      title: command.title,
      lastActiveDate: new Date(),
      refreshToken,
      expirationDate: new Date(Date.now() + 2592000), // Здесь можно тоже вытащить из конфига при желании
    });

    return { accessToken, refreshToken };
  }
}
