import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { appConfig } from '../../../common/config/config';
import { JwtPayload } from './interface/jwt-payload.interface'; // создай интерфейс

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Bearer <token>
      ignoreExpiration: false,
      secretOrKey: appConfig.AC_SECRET,
    });
  }

  // Этот метод вызывается автоматически после верификации токена
  // payload — это уже распарсенный и проверенный токен
  async validate(payload: JwtPayload) {
    if (!payload.userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Здесь можно дополнительно проверить пользователя в БД, если нужно
    // Например: const user = await this.usersService.findById(payload.userId);
    // if (!user) throw new UnauthorizedException();

    // Возвращаем то, что попадёт в req.user
    return {
      userId: payload.userId,
      // можно добавить другие поля: email, login и т.д., если они есть в токене
    };
  }
}
