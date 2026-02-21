import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domain/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { BcryptService } from './adapters/bcrypt.service';
import { AuthController } from './api/auth.controller';
import { SecurityDevicesController } from './api/security-devices.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { appConfig } from '../../common/config/config';
import { JwtStrategy } from './strategies/jwt.service';
import { AuthService } from './application/auth.service';
import { NodemailerService } from './adapters/nodemailer.service';
import { RequestLog, RequestLogSchema } from './domain/request-log.schema';
import { RateLimiterInterceptor } from './adapters/request-logger-limiter.middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BasicAuthGuard } from './api/guards/basic-auth.guard';
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
// import { RequestLoggerAndLimiterMiddleware } from './adapters/request-logger-limiter.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: RequestLog.name, schema: RequestLogSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: appConfig.AC_SECRET,
      signOptions: { expiresIn: Number(appConfig.AC_TIME) },
    }),
    CqrsModule,
  ],
  controllers: [UsersController, AuthController, SecurityDevicesController],
  providers: [
    AuthService,
    UsersRepository,
    UsersQueryRepository,
    JwtStrategy,
    // SecurityDevicesQueryRepository,
    // AuthQueryRepository,
    BcryptService,
    NodemailerService,
    BasicAuthGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimiterInterceptor,
    },
    CreateUserUseCase,
    DeleteUserUseCase,
    // UpdateUserUseCase,
    GetAllUsersHandler,
    // RequestLoggerAndLimiterMiddleware,
    LoginUserUseCase,
    RegisterUserUseCase,
    ConfirmEmailUseCase,
    ResendConfirmationUseCase,
    PasswordRecoveryUseCase,
    ChangePasswordUseCase,
    RefreshTokensUseCase,
    GetMeHandler,
  ],
})
export class UserAccountsModule {}
