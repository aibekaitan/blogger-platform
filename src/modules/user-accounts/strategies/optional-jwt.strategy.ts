// optional-jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { appConfig } from '../../../common/config/config';

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
    });
  }

  async validate(payload: any) {
    // Токен уже проверен, просто возвращаем данные пользователя
    return {
      id: payload.userId,
      deviceId: payload.deviceId,
      // login: payload.login, // если есть
    };
  }
}
