import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Request, Response } from 'express';

import { LoginInputDto } from './input-dto/login.input.dto';
import { UserInputDto } from './input-dto/users.input.dto';
import { RegistrationConfirmationInputDto } from './input-dto/registration-confirmation.input.dto';
import { RegistrationResendingInputDto } from './input-dto/registration-resending.input.dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input.dto';
import { NewPasswordInputDto } from './input-dto/new-password.input.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { NoRateLimit } from '../../../common/decorators/no-rate-limit.decorator';
import { LoginUserCommand } from '../application/usecases/auth/login-user.use-case';
import { RefreshTokensCommand } from '../application/usecases/auth/refresh-tokens.use-case';
import { RegisterUserCommand } from '../application/usecases/auth/register-user.use-case';
import { ConfirmEmailCommand } from '../application/usecases/auth/confirm-email.use-case';
import { ResendConfirmationCommand } from '../application/usecases/auth/resend-confirmation.use-case';
import { PasswordRecoveryCommand } from '../application/usecases/auth/password-recovery.use-case';
import { ChangePasswordCommand } from '../application/usecases/auth/change-password.use-case';
import { GetMeQuery } from '../application/usecases/auth/get-me.handler';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentDeviceId } from '../../../common/decorators/current-device-id.decorator';
import { LogoutCommand } from '../application/usecases/auth/logout-user.use-case';
import { JwtService } from '@nestjs/jwt';
import { appConfig } from '../../../common/config/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginInputDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || 'unknown';
    const title = req.headers['user-agent'] || 'Unknown device';

    const { accessToken, refreshToken } = await this.commandBus.execute(
      new LoginUserCommand(loginDto.loginOrEmail, loginDto.password, ip, title),
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { accessToken };
  }
  @NoRateLimit()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  async refreshToken(
    @CurrentUser() user: { id: string },
    @CurrentDeviceId() deviceId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken: newRefreshToken } =
      await this.commandBus.execute(
        new RefreshTokensCommand(user.id, deviceId),
      );

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { accessToken };
  }

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() registrationDto: UserInputDto) {
    await this.commandBus.execute(
      new RegisterUserCommand(
        registrationDto.login,
        registrationDto.password,
        registrationDto.email,
      ),
    );

    // 204 No Content
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(
    @Body() codeDto: RegistrationConfirmationInputDto,
  ) {
    await this.commandBus.execute(new ConfirmEmailCommand(codeDto.code));
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(
    @Body() emailDto: RegistrationResendingInputDto,
  ) {
    await this.commandBus.execute(
      new ResendConfirmationCommand(emailDto.email),
    );
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() emailDto: PasswordRecoveryInputDto) {
    await this.commandBus.execute(new PasswordRecoveryCommand(emailDto.email));
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() dto: NewPasswordInputDto) {
    await this.commandBus.execute(
      new ChangePasswordCommand(dto.recoveryCode, dto.newPassword),
    );
  }
  // в auth.controller.ts или где удобно
  // @Get('debug-token')
  // @NoRateLimit() // или без guards вообще
  // async debug(@Headers('authorization') authHeader: string) {
  //
  //
  //   if (!authHeader?.startsWith('Bearer ')) {
  //     return { error: 'Нет Bearer токена в заголовке' };
  //   }
  //
  //   const token = authHeader.split(' ')[1];
  //   console.log('Токен:', token);
  //
  //   try {
  //     const payload = await this.jwtService.verify(token, {
  //       secret: appConfig.AC_SECRET,
  //     });
  //     return {
  //       valid: true,
  //       payload,
  //       header: authHeader,
  //     };
  //   } catch (e) {
  //     return {
  //       valid: false,
  //       error: e.message,
  //       name: e.name,
  //       token,
  //     };
  //   }
  // }
  @NoRateLimit()
  @UseGuards(JwtAuthGuard) // ← именно этот guard!
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: { id: string; login: string }) {
    return this.queryBus.execute(new GetMeQuery(user.id));
  }
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuard)
  async logout(
    @CurrentDeviceId() deviceId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.commandBus.execute(new LogoutCommand(deviceId));

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // 204 No Content
  }
}
