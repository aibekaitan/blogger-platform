import {
  Controller,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Res,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ResultStatus } from '../../../common/result/resultCode';
import { GetAllDevicesQuery } from '../application/usecases/security-devices/get-all-devices.query';
import { TerminateAllExceptCurrentCommand } from '../application/usecases/security-devices/terminate-all-except-current.command';
import { TerminateDeviceCommand } from '../application/usecases/security-devices/terminate-device.command';
// import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtUser } from '../../bloggers-platform/api/posts.controller';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { NoRateLimit } from '../../../common/decorators/no-rate-limit.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // или откуда у тебя JwtUser

// security-devices.controller.ts
@NoRateLimit()

@Controller('security/devices')
export class SecurityDevicesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  @UseGuards(RefreshTokenGuard)
  @Get()
  async getAllDevices(@CurrentUser() user: JwtUser) {
    return this.queryBus.execute(new GetAllDevicesQuery(user.id));
  }
  @UseGuards(RefreshTokenGuard)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateAllExceptCurrent(@CurrentUser() user: JwtUser) {
    if (!user.id) {
      throw new UnauthorizedException('Device ID not found in token');
    }
    const result = await this.commandBus.execute(
      new TerminateAllExceptCurrentCommand(user.id, user.id),
    );
    if (result.status !== ResultStatus.Success) {
      throw new ForbiddenException(result.extensions);
    }
  }
  @UseGuards(RefreshTokenGuard)
  @Delete(':deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateDeviceById(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: JwtUser,
  ) {
    const result = await this.commandBus.execute(
      new TerminateDeviceCommand(user.id, deviceId),
    );
    if (result.status !== ResultStatus.Success) {
      if (result.status === ResultStatus.NotFound) {
        throw new NotFoundException(result.extensions);
      }
      if (result.status === ResultStatus.Forbidden) {
        throw new ForbiddenException(result.extensions);
      }
      throw new BadRequestException(result.extensions);
    }
  }
}
