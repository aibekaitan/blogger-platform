import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Types } from 'mongoose';

import { BasicAuthGuard } from './guards/basic-auth.guard';
import { NoRateLimit } from '../../../common/decorators/no-rate-limit.decorator';

import type { UsersQueryFieldsType } from '../types/users.queryFields.type';
import { IPagination } from '../../../common/types/pagination';
import { IUserView } from '../types/user.view.interface';
import { UserInputDto } from './input-dto/users.input.dto';
import { GetAllUsersQuery } from '../application/usecases/get.all.users.usecase';
import { CreateUserCommand } from '../application/usecases/create-user.usecase';
import { DeleteUserCommand } from '../application/usecases/delete-user.usecase'; // или CreateUserInputDto / UserInputDto — как у тебя

@NoRateLimit()
@Controller('users')
@UseGuards(BasicAuthGuard)
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getAllUsers(
    @Query() query: UsersQueryFieldsType,
  ): Promise<IPagination<IUserView[]>> {
    return this.queryBus.execute(new GetAllUsersQuery(query));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: UserInputDto): Promise<IUserView> {
    // Отправляем команду → use-case возвращает IUserView целиком
    return this.commandBus.execute<IUserView>(new CreateUserCommand(dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user id');
    }

    await this.commandBus.execute(new DeleteUserCommand(id));
  }
}
