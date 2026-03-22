import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserAccountsConfig } from '../config/user-accounts.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userAccountsConfig: UserAccountsConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: userAccountsConfig.accessTokenSecret,
    });
  }

  async validate(payload: any) {
    return { id: payload.userId };
  }
}
