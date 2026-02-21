import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  // BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
// import { randomUUID } from 'crypto';

import { UsersRepository } from '../infrastructure/users.repository';
import { NodemailerService } from '../adapters/nodemailer.service';
// import { emailExamples } from '../adapters/emailExamples';
import { BcryptService } from '../adapters/bcrypt.service';
import { IUserDB } from '../types/user.db.interface';
// import { User } from '../domain/user.entity';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { randomUUID } from 'crypto';
import { emailExamples } from '../adapters/emailExamples';
import { User } from '../domain/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    private readonly usersQueryRepo: UsersQueryRepository,
    private readonly bcryptService: BcryptService,
    private readonly nodemailerService: NodemailerService,
  ) {}

  async loginUser(
    loginOrEmail: string,
    password: string,
    ip: string,
    title: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.validateUserCredentials(loginOrEmail, password);

    const userId = user._id.toString();
    const login = user.login;

    const accessToken = await this.generateAccessToken(userId, login);
    const refreshToken = await this.generateRefreshToken(userId, login);
    // const deviceId = randomUUID();
    // await this.devicesRepository.upsertDevice({ ... });

    return { accessToken, refreshToken };
  }

  private async validateUserCredentials(
    loginOrEmail: string,
    password: string,
  ): Promise<IUserDB> {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.bcryptService.checkPassword(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  private async generateAccessToken(
    userId: string,
    login: string,
  ): Promise<string> {
    const payload = { userId, login };
    return this.jwtService.signAsync(payload, { expiresIn: '300s' }); // 5 минут
  }

  private async generateRefreshToken(
    userId: string,
    login: string,
  ): Promise<string> {
    const payload = { userId, login };
    return this.jwtService.signAsync(payload);
  }

  async registerUser(
    login: string,
    password: string,
    email: string,
  ): Promise<void> {
    // const exists = await this.usersRepository.doesExistByLoginOrEmail(
    //   login,
    //   email,
    // );
    // if (exists) {
    //   throw new BadRequestException({
    //     errorsMessages: [
    //       { message: 'Login or email already exists', field: 'loginOrEmail' },
    //     ],
    //   });
    // }
    const existingLogin = await this.usersRepository.findByLogin(login);
    if (existingLogin) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'Login already exists',
            field: 'login',
          },
        ],
      });
    }
    const existingEmail = await this.usersRepository.findByEmail(email);
    if (existingEmail) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'Email already exists',
            field: 'email',
          },
        ],
      });
    }
    const confirmationCode = randomUUID();
    const expirationDate = new Date(Date.now() + 60 * 60 * 1000); // 1 час
    const passwordHash = await this.bcryptService.generateHash(password);
    const dto = {
      id: uuidv4(),
      login,
      email,
      passwordHash,
    };
    const newUser = User.createInstance(dto);
    newUser.emailConfirmation = {
      confirmationCode,
      expirationDate,
      isConfirmed: false,
    };
    await this.usersRepository.create(newUser);
    // Отправка email подтверждения
    await this.nodemailerService
      .sendEmail(
        newUser.email,
        newUser.emailConfirmation.confirmationCode,
        emailExamples.registrationEmail,
      )
      .catch((err) => console.error('Email send error:', err));
  }
  async confirmEmail(code: string): Promise<void> {
    const user = await this.usersRepository.findUserByConfirmationCode(code);
    if (!user) {
      throw new BadRequestException({
        errorsMessages: [
          { message: 'Incorrect or expired code', field: 'code' },
        ],
      });
    }
    if (user.emailConfirmation.isConfirmed) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'Code already confirmed', field: 'code' }],
      });
    }
    await this.usersRepository.updateConfirmation(user._id);
  }
  async resendRegistrationEmail(email: string): Promise<void> {
    const user = await this.usersRepository.findByLoginOrEmail(email);
    if (!user) {
      throw new BadRequestException({
        errorsMessages: [{ message: 'User not found', field: 'email' }],
      });
    }
    if (user.emailConfirmation.isConfirmed) {
      throw new BadRequestException({
        errorsMessages: [
          { message: 'Email already confirmed', field: 'email' },
        ],
      });
    }
    user.emailConfirmation.confirmationCode = randomUUID();
    await this.usersRepository.updateConfirmationCode(
      user._id,
      user.emailConfirmation.confirmationCode,
    );
    await this.nodemailerService
      .sendEmail(
        user.email,
        user.emailConfirmation.confirmationCode,
        emailExamples.registrationEmail,
      )
      .catch((err) => console.error('Resend email error:', err));
  }
  async passwordRecovery(email: string): Promise<void> {
    const user = await this.usersRepository.findByLoginOrEmail(email);
    if (!user) {
      return;
    }
    user.passwordRecoveryCode = randomUUID();
    await this.usersRepository.updatePasswordRecoveryCode(
      user._id,
      user.passwordRecoveryCode,
    );
    await this.nodemailerService
      .sendEmail(
        user.email,
        user.passwordRecoveryCode,
        emailExamples.passwordRecoveryEmail,
      )
      .catch((err) => console.error('Recovery email error:', err));
  }
  async changePassword(
    recoveryCode: string,
    newPassword: string,
  ): Promise<void> {
    const user =
      await this.usersRepository.findUserByPasswordRecoveryCode(recoveryCode);
    if (!user) {
      throw new BadRequestException({
        errorsMessages: [
          {
            message: 'Incorrect or expired recovery code',
            field: 'recoveryCode',
          },
        ],
      });
    }
    const passwordHash = await this.bcryptService.generateHash(newPassword);
    await this.usersRepository.updatePassword(user._id, passwordHash);
  }
  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('RT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (!payload?.login || !payload?.userId) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }
    // const device = await this.devicesRepository.findByDeviceId(
    //   payload.deviceId,
    // );
    // if (!device || device.userId !== payload.userId) {
    //   throw new UnauthorizedException('Session not found');
    // }
    const newAccessToken = await this.generateAccessToken(
      payload.userId,
      payload.login,
    );
    const newRefreshToken = await this.generateRefreshToken(
      payload.userId,
      payload.login,
    );
    // await this.devicesRepository.upsertDevice({
    //   userId: payload.userId,
    //   deviceId: payload.deviceId,
    //   ip: device.ip,
    //   title: device.title,
    //   lastActiveDate: new Date(),
    //   expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    //   refreshToken: newRefreshToken,
    // });
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
  async getMe(userId: string) {
    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.usersQueryRepo.getByIdOrNotFoundFail(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      email: user.email,
      login: user.login,
      userId: user.id.toString(),
    };
  }
}
