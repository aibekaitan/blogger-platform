import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CoreConfig } from './core/core.config';
import { DynamicModule } from '@nestjs/common';

/**
 * Функция инициализации AppModule.
 * Сначала создает контекст приложения для получения CoreConfig,
 * а затем возвращает динамически настроенный AppModule.
 */
export async function initAppModule(): Promise<DynamicModule> {
  // Создаем временный контекст, чтобы "вытащить" из него CoreConfig
  // Это запустит загрузку .env и валидацию CoreConfig
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const coreConfig = appContext.get<CoreConfig>(CoreConfig);
  
  // Закрываем временный контекст
  await appContext.close();

  // Возвращаем AppModule, настроенный с учетом полученного конфига
  return AppModule.forRoot(coreConfig);
}
