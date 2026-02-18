// src/common/interceptors/rate-limiter.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reflector } from '@nestjs/core';
import { NO_RATE_LIMIT_KEY } from '../../../common/decorators/no-rate-limit.decorator';
import { RequestLog } from '../domain/request-log.schema';

const REQUEST_LIMIT = 5;
const TIME_WINDOW_MS = 10 * 1000;

@Injectable()
export class RateLimiterInterceptor implements NestInterceptor {
  constructor(
    @InjectModel(RequestLog.name)
    private readonly requestLogModel: Model<RequestLog>,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req:any = context.switchToHttp().getRequest<Request>();

    const noRateLimit = this.reflector.getAllAndOverride<boolean>(
      NO_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (noRateLimit) {
      await this.logRequest(req);
      return next.handle();
    }

    // Логика лимита
    const ip = req.ip || 'unknown';
    const url = req.originalUrl;
    const now = new Date();

    await this.logRequest(req);

    const tenSecondsAgo = new Date(now.getTime() - TIME_WINDOW_MS);

    const count = await this.requestLogModel
      .countDocuments({
        ip,
        url,
        date: { $gte: tenSecondsAgo },
      })
      .exec();

    if (count > REQUEST_LIMIT) {
      throw new HttpException(
        {
          errorsMessages: [
            {
              message:
                'More than 5 attempts from one IP-address during 10 seconds',
            },
          ],
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next.handle();
  }

  private async logRequest(req) {
    const ip = req.ip || 'unknown';
    const url = req.originalUrl;
    const now = new Date();

    await this.requestLogModel.create({
      ip,
      url,
      date: now,
      method: req.method,
    });
  }
}
