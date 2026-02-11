import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { BcryptService } from '../adapters/bcrypt.service';
import { CreateUserDto, UpdateUserDto } from '../dto/create-user.dto';
import { IPagination } from '../../../common/types/pagination';
import { UsersQueryFieldsType } from '../types/users.queryFields.type';
import { IUserView } from '../types/user.view.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly userQueryRepository: UsersQueryRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async getAllUsers(
    query: UsersQueryFieldsType,
  ): Promise<IPagination<IUserView[]>> {
    return this.userQueryRepository.findAllUsers({
      searchLoginTerm: query.searchLoginTerm,
      searchEmailTerm: query.searchEmailTerm,
      pageNumber: Number(query.pageNumber) || 1,
      pageSize: Number(query.pageSize) || 10,
      sortBy: query.sortBy ?? 'createdAt',
      sortDirection: query.sortDirection === 'asc' ? 1 : -1,
    });
  }

  async createUser(dto: CreateUserDto): Promise<IUserView> {
    const passwordHash = await this.bcryptService.generateHash(dto.password);

    const newUser = {
      id: uuidv4(),
      login: dto.login,
      email: dto.email,
      passwordHash,
      createdAt: new Date(),
    };

    const userId = await this.userRepository.create(newUser);

    const userView =
      await this.userQueryRepository.getByIdOrNotFoundFail(userId);

    return {
      id: userView.id,
      login: userView.login,
      email: userView.email,
      createdAt: new Date(userView.createdAt).toISOString(),
    };
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.userRepository.delete(id);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<IUserView> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (dto.email) user.email = dto.email;

    await this.userRepository.save(user);

    const updatedView =
      await this.userQueryRepository.getByIdOrNotFoundFail(id);

    return {
      id: updatedView.id,
      login: updatedView.login,
      email: updatedView.email,
      createdAt: new Date(updatedView.createdAt).toISOString(),
    };
  }
}
