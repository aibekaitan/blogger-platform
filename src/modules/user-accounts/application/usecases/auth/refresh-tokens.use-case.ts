// refresh-tokens.use-case.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import ms from 'ms';
import { Command } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../infrastructure/security-devices/security-devices.repository';
import { UsersRepository } from '../../../infrastructure/users.repository';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../../constants';
import { UserAccountsConfig } from '../../../config/user-accounts.config';

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
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly accessTokenService: JwtService,
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenService: JwtService,
    private readonly userAccountsConfig: UserAccountsConfig,
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

    const newAccessToken = this.accessTokenService.sign({
      userId,
      login,
      deviceId,
    });
    const newRefreshToken = this.refreshTokenService.sign({
      userId,
      login,
      deviceId,
    });

    await this.devicesRepo.upsertDevice({
      userId,
      deviceId: deviceId,
      ip: existingDevice.ip,
      title: existingDevice.title,
      lastActiveDate: new Date(),
      refreshToken: newRefreshToken,
      expirationDate: new Date(
        Date.now() + ms(this.userAccountsConfig.refreshTokenExpireIn),
      ),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
