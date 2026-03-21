import { ConfigModule } from '@nestjs/config';

/**
 * Глобальный модуль конфигурации.
 * Настроен на поиск .env файлов в зависимости от текущего NODE_ENV.
 * Должен быть импортирован в самом верху списка imports в AppModule.
 */
export const configModule = ConfigModule.forRoot({
  envFilePath: [
    process.env.ENV_FILE_PATH?.trim() || '',
    `.env.${process.env.NODE_ENV}.local`,
    `.env.${process.env.NODE_ENV}`,
    '.env.production',
    '.env',
  ],
  isGlobal: true,
});
