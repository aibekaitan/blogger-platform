// refresh-tokens.use-case.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';

import { Command } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../infrastructure/security-devices/security-devices.repository';
import { UsersRepository } from '../../../infrastructure/users.repository';

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
    private readonly usersRepo: UsersRepository,
  ) {}

  async execute(
    command: RefreshTokensCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId, deviceId } = command;

    const existingDevice = await this.devicesRepo.findByDeviceId(deviceId);
    if (!existingDevice) {
      throw new NotFoundException('Device session not found');
    }

    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const login = user.login;

    const accessPayload = { userId, login, deviceId };

    const newAccessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.getOrThrow('AC_SECRET'),
      expiresIn: this.configService.getOrThrow('AC_TIME'),
    });

    const refreshPayload = { userId, login, deviceId };

    const newRefreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.getOrThrow('RT_SECRET'),
      expiresIn: this.configService.getOrThrow('RT_TIME'),
    });

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
