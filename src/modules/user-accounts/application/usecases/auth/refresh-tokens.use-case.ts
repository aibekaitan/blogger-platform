// refresh-tokens.command.ts

// refresh-tokens.use-case.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { Command } from '@nestjs/cqrs';

export class RefreshTokensCommand extends Command<{
  accessToken: string;
  refreshToken: string;
}> {
  constructor(public readonly refreshToken: string) {
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
  ) {}

  async execute(
    command: RefreshTokensCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = command;

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('RT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload?.userId || !payload?.login) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const newAccessToken = this.jwtService.sign(
      { userId: payload.userId, login: payload.login },
      { expiresIn: '300s' },
    );

    const newRefreshToken = this.jwtService.sign({
      userId: payload.userId,
      login: payload.login,
    });

    // TODO: здесь можно добавить обновление device/session если нужно

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
