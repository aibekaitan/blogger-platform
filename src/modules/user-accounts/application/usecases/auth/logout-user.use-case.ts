// application/usecases/auth/logout-user.use-case.ts

// import { Command } from '@nestjs/cqrs';


// application/usecases/auth/logout-user.handler.ts

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../../infrastructure/security-devices/security-devices.repository';

export class LogoutCommand {
  constructor(
    public readonly deviceId: string,
    // можно добавить userId, ip и т.д. если нужно для логов/аудита
  ) {}
}
@CommandHandler(LogoutCommand)
export class LogoutUseCase implements ICommandHandler<LogoutCommand> {
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(command: LogoutCommand): Promise<void> {
    const { deviceId } = command;

    // Удаляем сессию устройства
    const deleted = await this.devicesRepository.deleteByDeviceId(deviceId);

    if (!deleted) {
      // Можно просто молча завершать, либо кидать исключение — зависит от требований
      // throw new NotFoundException('Session not found');
    }

    // Здесь можно добавить дополнительные действия:
    // - инвалидация refresh-токена в blacklist (если используете)
    // - логирование выхода
    // - уведомление пользователя по email и т.д.
  }
}