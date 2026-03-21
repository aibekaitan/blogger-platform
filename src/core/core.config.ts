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
  @IsEnum(Environments, {
    message:
      'Set correct NODE_ENV value, available values: ' +
      configValidationUtility.getEnumValues(Environments).join(', '),
  })
  env: string = this.configService.get('NODE_ENV') || Environments.DEVELOPMENT;

  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3000',
    },
  )
  port: number = Number(this.configService.get('PORT')) || 5005;

  @IsNotEmpty({
    message: 'Set Env variable DATABASE_URL for PostgreSQL connection',
  })
  databaseUrl: string = this.configService.get('DATABASE_URL');

  @IsBoolean({
    message: 'Set Env variable IS_SWAGGER_ENABLED (true/false)',
  })
  isSwaggerEnabled: boolean =
    configValidationUtility.convertToBoolean(
      this.configService.get('IS_SWAGGER_ENABLED'),
    ) ?? true;

  @IsBoolean({
    message: 'Set Env variable INCLUDE_TESTING_MODULE (true/false)',
  })
  includeTestingModule: boolean =
    configValidationUtility.convertToBoolean(
      this.configService.get('INCLUDE_TESTING_MODULE'),
    ) ?? false;

  constructor(private configService: ConfigService<any, true>) {
    configValidationUtility.validateConfig(this);
  }
}
