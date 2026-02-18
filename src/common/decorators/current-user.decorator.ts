// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express'; // или import { Request } from '@nestjs/common'; если используешь Request от Nest

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user; // это то, что вернула стратегия (jwt или optional-jwt)
  },
);
