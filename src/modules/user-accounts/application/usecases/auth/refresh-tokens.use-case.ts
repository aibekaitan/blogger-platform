// refresh-tokens.use-case.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ms from 'ms'; // ← предполагаем, что уже установлен и импортирован

import { Command } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../infrastructure/security-devices/security-devices.repository';
import { UsersRepository } from '../../../infrastructure/users.repository'; // ← добавляем импорт

export class RefreshTokensCommand extends Command<{
  accessToken: string;
  refreshToken: string;
}> {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {
    super();
  }
}

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensUseCase implements ICommandHandler<
  RefreshTokensCommand,
  { accessToken: string; refreshToken: string }
> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly devicesRepo: DevicesRepository,
    private readonly usersRepo: UsersRepository, // ← добавляем зависимость
  ) {}

  async execute(
    command: RefreshTokensCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId, deviceId } = command;

    // 1. Находим устройство (guard уже проверял, но для безопасности)
    const existingDevice = await this.devicesRepo.findByDeviceId(deviceId);
    if (!existingDevice) {
      throw new NotFoundException('Device session not found');
    }

    // 2. Запрашиваем пользователя по userId, чтобы взять актуальный login
    const user = await this.usersRepo.findById(userId); // адаптируй под реальный метод твоего репозитория
    if (!user) {
      throw new NotFoundException('User not found'); // или UnauthorizedException, если хочешь
    }

    const login = user.login; // предполагаем, что в модели пользователя есть поле login

    // 3. Payload'ы — теперь с реальным login
    const accessPayload = { userId, login, deviceId }; // deviceId опционально

    const newAccessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.getOrThrow('AC_SECRET'),
      expiresIn: this.configService.getOrThrow('AC_TIME'),
    });

    const refreshPayload = { userId, login, deviceId };

    const newRefreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.getOrThrow('RT_SECRET'),
      expiresIn: this.configService.getOrThrow('RT_TIME'),
    });

    // 4. Обновляем устройство
    await this.devicesRepo.upsertDevice({
      userId,
      deviceId,
      ip: existingDevice.ip,
      title: existingDevice.title,
      lastActiveDate: new Date(),
      refreshToken: newRefreshToken,
      expirationDate: new Date(
        Date.now() + ms(this.configService.getOrThrow('RT_TIME')),
      ),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}