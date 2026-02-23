// src/user-accounts/api/guards/refresh-token.guard.ts

import {
  Injectable,
  UnauthorizedException,
  ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DevicesRepository } from '../../infrastructure/security-devices/security-devices.repository';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly devicesRepo: DevicesRepository,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const refreshToken = request.cookies?.refreshToken;

    const rtSecret = this.configService.get<string>('RT_SECRET');

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookie');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: rtSecret,
        ignoreExpiration: false,
      });
    } catch (e) {
      throw new UnauthorizedException(
        `Refresh token validation failed: ${e.message}`,
      );
    }

    if (!payload?.userId || !payload?.deviceId) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    // 3. Проверяем устройство в БД
    const device = await this.devicesRepo.findByDeviceId(payload.deviceId);
    if (!device) {
      throw new UnauthorizedException('Session not found — device invalid');
    }

    if (device.userId !== payload.userId) {
      throw new UnauthorizedException('Device belongs to another user');
    }

    if (device.refreshToken !== refreshToken) {
      throw new UnauthorizedException(
        'Refresh token mismatch — session compromised',
      );
    }

    // if (device.expirationDate < new Date()) {
    //   throw new UnauthorizedException('Session expired');
    // }

    // 4. Всё ок — сохраняем user и deviceId в request
    request.user = { id: payload.userId };
    request.context = { deviceId: payload.deviceId };

    return true;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }
    return user;
  }
}
