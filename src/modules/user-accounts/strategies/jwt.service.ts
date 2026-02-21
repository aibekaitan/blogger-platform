// jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { appConfig } from '../../../common/config/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.AC_SECRET,
    });
  }

  async validate(payload: any) {
    if (!payload.userId) {
      throw new UnauthorizedException('Invalid token payload: userId missing');
    }

    return {
      id: payload.userId,
      login: payload.login || 'Unknown',
      deviceId: payload.deviceId || null,
    };
  }
}
