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
  UseGuards,
} from '@nestjs/common';
// import { UsersService } from '../domain/users.service';
// import { CreateUserDto } from '../dto/create-user.dto';
import type { UsersQueryFieldsType } from '../types/users.queryFields.type';
import { IPagination } from '../../../common/types/pagination';
import { IUserView } from '../types/user.view.interface';
import { Types } from 'mongoose';
import { UsersService } from '../application/users.service';
import { UserInputDto } from './input-dto/users.input.dto';
import { NoRateLimit } from '../../../common/decorators/no-rate-limit.decorator';
import { BasicAuthGuard } from '../adapters/basic-auth.guard';
// import { AuthGuard } from '@nestjs/passport';
// import { JwtAuthGuard } from './guards/jwt-auth.guard';

@NoRateLimit()
@Controller('users')
@UseGuards(BasicAuthGuard)
// путь /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(
    @Query() query: UsersQueryFieldsType,
  ): Promise<IPagination<IUserView[]>> {
    return await this.usersService.getAllUsers(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: UserInputDto): Promise<IUserView> {
    return this.usersService.createUser(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user id');
    }

    const user = await this.usersService.deleteUser(id);
    return;
  }
}
