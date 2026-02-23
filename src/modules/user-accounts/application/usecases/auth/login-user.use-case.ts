import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { Command } from '@nestjs/cqrs';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { BcryptService } from '../../../adapters/bcrypt.service';
import { DevicesRepository } from '../../../infrastructure/security-devices/security-devices.repository';

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

    const userId = user._id.toString();
    const login = user.login;
    const payload = { userId, login };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('AC_SECRET'),
      expiresIn: this.configService.getOrThrow('AC_TIME'),
    });
    // генерируем уникальный deviceId (uuid или просто строка)
    const deviceId = crypto.randomUUID(); // или import { v4 as uuidv4 } from 'uuid';

    // для refresh токена добавляем deviceId
    const refreshPayload = { userId, login, deviceId };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.getOrThrow('RT_SECRET'),
      // expiresIn: '259200033',
      expiresIn: this.configService.getOrThrow('RT_TIME'), // убедись, что это '30d' или '2592000s'
    });

    await this.devicesRepository.upsertDevice({
      userId,
      deviceId,
      ip: command.ip,
      title: command.title,
      lastActiveDate: new Date(),
      refreshToken, // храни сам токен (или его hash)
      expirationDate: new Date(Date.now() + 2592000),
    });

    return { accessToken, refreshToken };
  }
}
