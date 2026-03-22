import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { configValidationUtility } from '../../../setup/config-validation.utility';

@Injectable()
export class UserAccountsConfig {
  @IsString()
  @IsNotEmpty()
  accessTokenSecret: string;

  @IsString()
  @IsNotEmpty()
  accessTokenExpireIn: string;

  @IsString()
  @IsNotEmpty()
  refreshTokenSecret: string;

  @IsString()
  @IsNotEmpty()
  refreshTokenExpireIn: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  emailPass: string;

  constructor(private configService: ConfigService<any, true>) {
    this.accessTokenSecret = this.configService.get('AC_SECRET');
    this.accessTokenExpireIn = this.configService.get('AC_TIME');
    this.refreshTokenSecret = this.configService.get('RT_SECRET');
    this.refreshTokenExpireIn = this.configService.get('RT_TIME');
    this.email = this.configService.get('EMAIL');
    this.emailPass = this.configService.get('EMAIL_PASS');

    configValidationUtility.validateConfig(this);
  }
}
