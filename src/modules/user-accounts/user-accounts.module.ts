import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { BcryptService } from './adapters/bcrypt.service';
import { AuthController } from './api/auth.controller';
import { SecurityDevicesController } from './api/security-devices.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.service';
import { NodemailerService } from './adapters/nodemailer.service';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateUserUseCase } from './application/usecases/users/create-user.usecase';
import { DeleteUserUseCase } from './application/usecases/users/delete-user.usecase';
import { GetAllUsersHandler } from './application/usecases/users/get.all.users.usecase';
import { LoginUserUseCase } from './application/usecases/auth/login-user.use-case';
import { RegisterUserUseCase } from './application/usecases/auth/register-user.use-case';
import { ConfirmEmailUseCase } from './application/usecases/auth/confirm-email.use-case';
import { ResendConfirmationUseCase } from './application/usecases/auth/resend-confirmation.use-case';
import { PasswordRecoveryUseCase } from './application/usecases/auth/password-recovery.use-case';
import { ChangePasswordUseCase } from './application/usecases/auth/change-password.use-case';
import { RefreshTokensUseCase } from './application/usecases/auth/refresh-tokens.use-case';
import { GetMeHandler } from './application/usecases/auth/get-me.handler';
import { TerminateAllExceptCurrentHandler } from './application/usecases/security-devices/terminate-all-except-current.command';
import { TerminateDeviceHandler } from './application/usecases/security-devices/terminate-device.command';
import { GetAllDevicesHandler } from './application/usecases/security-devices/get-all-devices.query';
import { DevicesRepository } from './infrastructure/security-devices/security-devices.repository';
import { SecurityDevicesQueryRepository } from './infrastructure/query/security-devices.query.repository';
import { RefreshTokenGuard } from './api/guards/refresh-token.guard';
import { LogoutUseCase } from './application/usecases/auth/logout-user.use-case';
import { UsersRepository } from './infrastructure/users.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './domain/device.model';
import { User } from './domain/user.entity';
import { UserAccountsConfigModule } from './config/user-accounts-config.module';
import { UserAccountsConfig } from './config/user-accounts.config';
import { BasicAuthGuard } from './api/guards/basic-auth.guard';

import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UserAccountsConfigModule,
    // JwtModule.registerAsync({
    //   imports: [UserAccountsConfigModule],
    //   useFactory: (config: UserAccountsConfig) => ({
    //     secret: config.accessTokenSecret,
    //     signOptions: { expiresIn: config.accessTokenExpireIn as any },
    //   }),
    //   inject: [UserAccountsConfig],
    // }), это лишнее, потому что он создает экземпляр jwtService
    // тем самым дает возможность другим классом использовать его за счет DI
    // У нас уже создаеться service путем декортаора который создает этот сервис, получаеться два Варианта Релизации
    CqrsModule,
  ],
  controllers: [UsersController, AuthController, SecurityDevicesController],
  providers: [
    UsersRepository,
    UsersQueryRepository,
    JwtStrategy,
    BcryptService,
    NodemailerService,
    BasicAuthGuard,
    RefreshTokenGuard,

    // Use Cases
    CreateUserUseCase,
    DeleteUserUseCase,
    GetAllUsersHandler,
    LoginUserUseCase,
    RegisterUserUseCase,
    ConfirmEmailUseCase,
    ResendConfirmationUseCase,
    PasswordRecoveryUseCase,
    ChangePasswordUseCase,
    RefreshTokensUseCase,
    GetMeHandler,
    LogoutUseCase,

    // Devices logic
    GetAllDevicesHandler,
    TerminateAllExceptCurrentHandler,
    TerminateDeviceHandler,
    DevicesRepository,
    SecurityDevicesQueryRepository,

    // Настройка токенов доступа (Access Token)
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (config: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: config.accessTokenSecret,
          signOptions: { expiresIn: config.accessTokenExpireIn as any },
        });
      },
      inject: [UserAccountsConfig],
    },
    // Настройка токенов обновления (Refresh Token)
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (config: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: config.refreshTokenSecret,
          signOptions: { expiresIn: config.refreshTokenExpireIn as any },
        });
      },
      inject: [UserAccountsConfig],
    },
  ],
  exports: [
    // UserAccountsConfigModule,
    ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
    REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
  ],
})
export class UserAccountsModule {}
