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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @NoRateLimit()
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

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.commandBus.execute(new RefreshTokensCommand(refreshToken));

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

    // 204 No Content — регистрация прошла успешно
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

  @NoRateLimit()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: Request) {
    const userId = req.user.userId; // из JwtAuthGuard

    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }

    return this.queryBus.execute(new GetMeQuery(userId));
  }
}
