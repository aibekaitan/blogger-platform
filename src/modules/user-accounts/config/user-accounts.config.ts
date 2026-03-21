import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { configValidationUtility } from '../../../setup/config-validation.utility';

@Injectable()
export class UserAccountsConfig {
  @IsNotEmpty({ message: 'Set Env variable AC_SECRET' })
  @IsString()
  accessTokenSecret: string = this.configService.get('AC_SECRET');

  @IsNotEmpty({ message: 'Set Env variable AC_TIME (e.g. 1h, 5m)' })
  accessTokenExpireIn: string = this.configService.get('AC_TIME');

  @IsNotEmpty({ message: 'Set Env variable RT_SECRET' })
  @IsString()
  refreshTokenSecret: string = this.configService.get('RT_SECRET');

  @IsNotEmpty({ message: 'Set Env variable RT_TIME (e.g. 7d, 24h)' })
  refreshTokenExpireIn: string = this.configService.get('RT_TIME');

  @IsEmail({}, { message: 'Set correct EMAIL variable' })
  email: string = this.configService.get('EMAIL');

  @IsNotEmpty({ message: 'Set Env variable EMAIL_PASS' })
  @IsString()
  emailPass: string = this.configService.get('EMAIL_PASS');

  constructor(private configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }
}
