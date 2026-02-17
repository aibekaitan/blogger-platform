// src/common/middleware/request-logger-limiter.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RequestLog } from '../domain/request-log.schema';

const REQUEST_LIMIT = 5;
const TIME_WINDOW_MS = 10 * 1000; // 10 секунд

@Injectable()
export class RequestLoggerAndLimiterMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(RequestLog.name)
    private readonly requestLogModel: Model<RequestLog>,
  ) {}

  async use(req, res, next): Promise<void> {
    const ip = req.ip || 'unknown';
    const url = req.originalUrl || req.baseUrl + req.path;
    const now = new Date();

    // Логируем запрос
    await this.requestLogModel.create({
      ip,
      url,
      date: now,
      method: req.method,
      userId: req.user?.userId || null, // если авторизация прошла
    });

    // Проверяем лимит
    const tenSecondsAgo = new Date(now.getTime() - TIME_WINDOW_MS);

    const count = await this.requestLogModel
      .countDocuments({
        ip,
        url,
        date: { $gte: tenSecondsAgo },
      })
      .exec();

    if (count > REQUEST_LIMIT) {
      res.status(429).json({
        errorsMessages: [
          {
            message:
              'More than 5 attempts from one IP-address during 10 seconds',
          },
        ],
      });
      return;
    }

    next();
  }
}
