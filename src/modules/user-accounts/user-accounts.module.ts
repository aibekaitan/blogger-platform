import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
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
import { BasicAuthGuard } from './adapters/basic-auth.guard';
// import { RequestLoggerAndLimiterMiddleware } from './adapters/request-logger-limiter.middleware';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: RequestLog.name, schema: RequestLogSchema },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }), // опционально, но полезно
    JwtModule.register({
      secret: appConfig.AC_SECRET,
      signOptions: { expiresIn: Number(appConfig.AC_TIME) }, // '5m' или Number
    }),
  ],
  controllers: [UsersController, AuthController, SecurityDevicesController],
  providers: [
    AuthService,
    UsersService,
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
    // RequestLoggerAndLimiterMiddleware,
  ],
})
export class UserAccountsModule {}
