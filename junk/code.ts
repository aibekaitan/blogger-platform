// // refresh-tokens.use-case.ts
// import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
// import { JwtService } from '@nestjs/jwt';
// import { ConfigService } from '@nestjs/config';
// import { DevicesRepository } from '../../../infrastructure/security-devices/security-devices.repository';
//
// import { RefreshTokensCommand } from './refresh-tokens.command';
//
// @CommandHandler(RefreshTokensCommand)
// export class RefreshTokensUseCase
//   implements ICommandHandler<RefreshTokensCommand, { accessToken: string; refreshToken: string }>
// {
//   constructor(
//     private readonly jwtService: JwtService,
//     private readonly configService: ConfigService,
//     private readonly devicesRepo: DevicesRepository,
//   ) {}
//
//   async execute(
//     command: RefreshTokensCommand,
//   ): Promise<{ accessToken: string; refreshToken: string }> {
//     const { refreshToken, userId, deviceId } = command; // ← теперь передаём из контроллера/guard
//
//     // Поскольку guard уже проверил всё — здесь только генерация и обновление
//
//     // Генерируем новые токены
//     const newAccessToken = this.jwtService.sign(
//       { userId, login: 'from-payload-or-db-if-needed', deviceId },
//       { expiresIn: '300s' },
//     );
//
//     const newRefreshToken = this.jwtService.sign(
//       { userId, login: 'from-payload-or-db-if-needed', deviceId },
//       { expiresIn: '30d' },
//     );
//
//     // Обновляем устройство
//     await this.devicesRepo.upsertDevice({
//       userId,
//       deviceId,
//       // ip и title можно оставить старые или обновить из request (если нужно)
//       lastActiveDate: new Date(),
//       expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//       refreshToken: newRefreshToken,
//     });
//
//     return { accessToken: newAccessToken, refreshToken: newRefreshToken };
//   }
// }