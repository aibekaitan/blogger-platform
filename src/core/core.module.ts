import { Global, Module } from '@nestjs/common';
import { CoreConfig } from './core.config';

/**
 * Глобальный модуль для общесистемных провайдеров.
 * CoreConfig регистрируется здесь, чтобы быть доступным во всех модулях.
 */
//по сути нужен просто чтобы разом у всех был доступ к конфигу, и не писать везде в провайдерах в каждом модуле
@Global()
@Module({
  providers: [CoreConfig],
  exports: [CoreConfig],
})
export class CoreModule {}
