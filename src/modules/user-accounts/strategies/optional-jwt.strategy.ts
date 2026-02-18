// optional-jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { appConfig } from '../../../common/config/config';
import { JwtPayload } from './interface/jwt-payload.interface';

@Injectable()
export class OptionalJwtStrategy extends PassportStrategy(
  Strategy,
  'optional-jwt',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.AC_SECRET,
      passReqToCallback: false, // не обязательно
    });
  }

  // Самое важное: НЕ кидаем ошибку, если токена нет или он неверный
  async validate(payload: JwtPayload | null): Promise<any> {
    // Если токена вообще не было → payload === null → возвращаем null
    if (!payload) {
      return null; // ← req.user будет null
    }

    // Если токен есть, но payload некорректный — тоже null (или можно throw, но лучше null)
    if (!payload.userId || !payload.deviceId) {
      return null;
    }

    return {
      userId: payload.userId,
      deviceId: payload.deviceId,
    };
  }
}
