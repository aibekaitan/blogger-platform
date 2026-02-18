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
import cookieParser from 'cookie-parser';

// import { RequestLoggerAndLimiterMiddleware } from './modules/user-accounts/adapters/request-logger-limiter.middleware';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      stopAtFirstError: false,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        console.log(
          'ValidationPipe triggered! Raw errors:',
          JSON.stringify(validationErrors, null, 2),
        );

        const errors = validationErrors.map((error) => {
          const firstConstraint = Object.values(error.constraints || {})[0];
          return {
            message: firstConstraint || 'Validation failed',
            field: error.property,
          };
        });

        console.log('Formatted errors:', errors);

        return new BadRequestException({
          errorsMessages: errors,
        });
      },
    }),
  );
  appSetup(app); //глобальные настройки приложения
  // const loggerMiddleware = app.get(RequestLoggerAndLimiterMiddleware);
  //
  // // Подключаем как функцию
  // app.use(loggerMiddleware.use.bind(loggerMiddleware));
  app.use(cookieParser());
  const PORT = process.env.PORT || 5005; //TODO: move to configService. will be in the following lessons

  await app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
  });
}
bootstrap();
