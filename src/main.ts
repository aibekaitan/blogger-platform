import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { RequestLoggerAndLimiterMiddleware } from './modules/user-accounts/adapters/request-logger-limiter.middleware';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  appSetup(app); //глобальные настройки приложения
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((e) => ({
          message: Object.values(e.constraints || {})[0],
          field: e.property,
        }));
        return new BadRequestException({ errorsMessages: messages });
      },
    }),
  );
  const loggerMiddleware = app.get(RequestLoggerAndLimiterMiddleware);

  // Подключаем как функцию
  app.use(loggerMiddleware.use.bind(loggerMiddleware));
  const PORT = process.env.PORT || 5005; //TODO: move to configService. will be in the following lessons

  await app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
  });
}
bootstrap();
