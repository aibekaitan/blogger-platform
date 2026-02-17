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
import type { Request, Response } from 'express';
// import { AuthService } from './auth.service'; // предполагаем, что лежит в той же папке или ./application/auth.service
// import { Result, ResultStatus } from '../../common/result/resultCode'; // адаптируй путь
// import { resultCodeToHttpException } from '../../common/result/resultCodeToHttpException';
// import { HttpStatuses } from '../../common/types/httpStatuses';

// DTO — создай их отдельно (рекомендую)

// Guards (создай их позже)
// import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginInputDto } from './input-dto/login.input.dto';
import { UserInputDto } from './input-dto/users.input.dto';
import { RegistrationConfirmationInputDto } from './input-dto/registration-confirmation.input.dto';
import { RegistrationResendingInputDto } from './input-dto/registration-resending.input.dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input.dto';
import { NewPasswordInputDto } from './input-dto/new-password.input.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
// import { ResultStatus } from '../../../common/result/resultCode';
// import { resultCodeToHttpException } from '../../../common/result/resultCodeToHttpException';
import { AuthService } from '../application/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginInputDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || 'unknown';
    const title = req.headers['user-agent'] || 'Unknown device';

    const result = await this.authService.loginUser(
      loginDto.loginOrEmail,
      loginDto.password,
      ip,
      title,
    );

    if (!result) {
      throw new BadRequestException();
    }

    const { accessToken, refreshToken } = result;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // в dev можно false
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
      throw new UnauthorizedException();
    }

    const result = await this.authService.refreshTokens(refreshToken);

    if (!result) {
      throw new UnauthorizedException();
    }

    const { accessToken, refreshToken: newRefreshToken } = result;

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return { accessToken };
  }

  // @Post('logout')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  //   const refreshToken = req.cookies?.refreshToken;
  //
  //   if (!refreshToken) {
  //     throw new UnauthorizedException();
  //   }
  //
  //   const result = await this.authService.logout(refreshToken);
  //
  //   if (result) {
  //     throw new UnauthorizedException();
  //   }
  //
  //   res.clearCookie('refreshToken', {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'strict',
  //   });
  //
  //   // ничего не возвращаем (204)
  // }

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() registrationDto: UserInputDto) {
    const result = await this.authService.registerUser(
      registrationDto.login,
      registrationDto.password,
      registrationDto.email,
    );

    // if (result.status !== ResultStatus.Success) {
    //   throw new BadRequestException(result.extensions);
    // }

    // 204 — ничего не возвращаем
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(
    @Body() codeDto: RegistrationConfirmationInputDto,
  ) {
    const result = await this.authService.confirmEmail(codeDto.code);

    // if (result.status !== ResultStatus.Success) {
    //   throw new BadRequestException(result.extensions);
    // }

    // 204
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(
    @Body() emailDto: RegistrationResendingInputDto,
  ) {
    const result = await this.authService.resendRegistrationEmail(
      emailDto.email,
    );

    // if (result.status !== ResultStatus.Success) {
    //   throw new BadRequestException(result.extensions);
    // }

    // 204
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() emailDto: PasswordRecoveryInputDto) {
    // всегда 204, даже если email не существует
    await this.authService.passwordRecovery(emailDto.email);
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() dto: NewPasswordInputDto) {
    const result = await this.authService.changePassword(
      dto.recoveryCode,
      dto.newPassword,
    );

    // if (result.status !== ResultStatus.Success) {
    //   throw new BadRequestException(result.extensions);
    // }

    // 204
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req) {
    const userId = req.user.userId; // или req.user.id — зависит от того, как ты payload делаешь

    if (!userId) {
      throw new UnauthorizedException();
    }

    const result = await this.authService.getMe(userId);

    if (!result) {
      throw new UnauthorizedException();
    }

    return result; // { email, login, userId }
  }
}
