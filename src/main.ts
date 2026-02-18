import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import * as dotenv from 'dotenv';
import { Error } from 'mongoose';

// import { RequestLoggerAndLimiterMiddleware } from './modules/user-accounts/adapters/request-logger-limiter.middleware';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  appSetup(app); //глобальные настройки приложения
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = validationErrors.map((error) => ({
          message:
            Object.values(error.constraints || {})[0] || 'Validation failed',
          field: error.property,
        }));

        return new BadRequestException({
          errorsMessages: errors,
        });
      },
    }),
  );
  // const loggerMiddleware = app.get(RequestLoggerAndLimiterMiddleware);
  //
  // // Подключаем как функцию
  // app.use(loggerMiddleware.use.bind(loggerMiddleware));
  const PORT = process.env.PORT || 5005; //TODO: move to configService. will be in the following lessons

  await app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
  });
}
bootstrap();
