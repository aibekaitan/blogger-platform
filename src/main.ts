import { NestFactory } from '@nestjs/core';
import { appSetup } from './setup/app.setup';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { initAppModule } from './init-app-module';
import { CoreConfig } from './core/core.config';

async function bootstrap() {
  // 1. Инициализируем динамический модуль (загрузка конфигов и валидация) а так же импортировать динамический зависимости
  // TestingModule, для определение нужен ли он в среде указанным в .env
  // (или короче: Загружаем конфиг и динамически решаем какие модули подключить)
  const DynamicAppModule = await initAppModule();

  // 2. Создаем приложение на основе динамического модуля
  const app = await NestFactory.create(DynamicAppModule);

  // 3. Получаем CoreConfig из контекста приложения
  const coreConfig = app.get<CoreConfig>(CoreConfig);

  // 4. Настраиваем пайпы, куки и прочее
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      stopAtFirstError: false,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = validationErrors.map((error) => {
          const firstConstraint = Object.values(error.constraints || {})[0];
          return {
            message: firstConstraint || 'Validation failed',
            field: error.property,
          };
        });

        return new BadRequestException({
          errorsMessages: errors,
        });
      },
    }),
  );

  appSetup(app);
  app.use(cookieParser());

  // 5. Запускаем сервер на порту из конфига
  const PORT = coreConfig.port;

  await app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
    console.log('Environment: ' + coreConfig.env);
  });
}

bootstrap();
