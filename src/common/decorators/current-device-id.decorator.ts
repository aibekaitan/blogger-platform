// src/common/decorators/current-device-id.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentDeviceId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.context?.deviceId;
  },
);
