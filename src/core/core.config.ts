import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { configValidationUtility } from '../setup/config-validation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

@Injectable()
export class CoreConfig {
  @IsEnum(Environments)
  env: string;

  @IsNumber()
  port: number;

  @IsNotEmpty()
  databaseUrl: string;

  @IsBoolean()
  isSwaggerEnabled: boolean;

  @IsBoolean()
  includeTestingModule: boolean;

  constructor(private configService: ConfigService<any, true>) {
    this.env = this.configService.get('NODE_ENV') || Environments.DEVELOPMENT;
    this.port = Number(this.configService.get('PORT')) || 5005;
    this.databaseUrl = this.configService.get('DATABASE_URL');
    this.isSwaggerEnabled =
      configValidationUtility.convertToBoolean(
        this.configService.get('IS_SWAGGER_ENABLED'),
      ) ?? true;
    this.includeTestingModule =
      configValidationUtility.convertToBoolean(
        this.configService.get('INCLUDE_TESTING_MODULE'),
      ) ?? false;

    configValidationUtility.validateConfig(this);
  }
}
