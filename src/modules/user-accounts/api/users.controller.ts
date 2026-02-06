import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
// import { UsersService } from '../domain/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import type { UsersQueryFieldsType } from '../types/users.queryFields.type';
import { IPagination } from '../../../common/types/pagination';
import { IUserView } from '../types/user.view.interface';
import { Types } from 'mongoose';
import { UsersService } from '../application/users.service';

@Controller('users') // путь /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users */
  @Get()
  async getAllUsers(
    @Query() query: UsersQueryFieldsType,
  ): Promise<IPagination<IUserView[]>> {
    return await this.usersService.getAllUsers(query);
  }

  /** POST /users */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDto): Promise<IUserView> {
    return this.usersService.createUser(dto);
  }

  /** DELETE /users/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user id');
    }

    const user = await this.usersService.deleteUser(id);
    // usersService.deleteUser уже кидает NotFoundException если не найден
    return;
  }
}
