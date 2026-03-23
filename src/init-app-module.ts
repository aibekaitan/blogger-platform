import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CoreConfig } from './core/core.config';
import { DynamicModule } from '@nestjs/common';

/**
 * Функция инициализации AppModule.
 * Сначала создает контекст приложения для получения CoreConfig,
 * а затем возвращает динамически настроенный AppModule.
 */

// Короче это нужно запустить для того чтобы сама функция forRoot сработало
// (ему нужен экземпляр конфига, то есть для импорта testingModule нужно знать .env)
// а мы не знаем их до запуска поэтому и делаем два запуска
// первый делает запуск и мы получаем config, после второй раз запускаем уже заранее загрузив туда конфиг который достал импорты
// просто ради одного импорта нужно было сделать два запуска
export async function initAppModule(): Promise<DynamicModule> {
  // Создаем временный контекст, чтобы "вытащить" из него CoreConfig
  // Это запустит загрузку .env и валидацию CoreConfig
  const appContext = await NestFactory.createApplicationContext(AppModule);
  //получаем конфиг из DI контейнера, тип указываем для генерика чтобы TS не ругался и знал какой тип возвращает get,
  //потому что get без типа возвращает any и мы не сможем получить coreConfig.port
  //А в аргументы передаем токен, то есть класс или строку "DI"
  const coreConfig = appContext.get<CoreConfig>(CoreConfig);

  // Закрываем временный контекст
  await appContext.close();

  // Возвращаем AppModule, настроенный с учетом полученного конфига
  return AppModule.forRoot(coreConfig);
}
