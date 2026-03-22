import { Global, Module } from '@nestjs/common';
import { CoreConfig } from './core.config';

/**
 * Глобальный модуль для общесистемных провайдеров.
 * CoreConfig регистрируется здесь, чтобы быть доступным во всех модулях.
 */
@Global()
@Module({
  providers: [CoreConfig],
  exports: [CoreConfig],
})
export class CoreModule {}
