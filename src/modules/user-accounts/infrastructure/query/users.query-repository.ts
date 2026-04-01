import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/user.entity';
import { SortQueryFilterType } from '../../../../common/types/sortQueryFilter.type';
import { IPagination } from '../../../../common/types/pagination';
import { IUserView, IUserView2 } from '../../types/user.view.interface';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findAllUsers(
    sortQueryDto: SortQueryFilterType,
  ): Promise<IPagination<IUserView[]>> {
    const {
      searchEmailTerm = null,
      searchLoginTerm = null,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      pageSize = 10,
      pageNumber = 1,
    } = sortQueryDto;

    const queryBuilder = this.usersRepository.createQueryBuilder('u');

    if (searchLoginTerm || searchEmailTerm) {
      queryBuilder.where(
        '(u.login ILIKE :login OR u.email ILIKE :email)',
        {
          login: searchLoginTerm ? `%${searchLoginTerm}%` : 'null',
          email: searchEmailTerm ? `%${searchEmailTerm}%` : 'null',
        },
      );
    }

    const allowedSortFields = ['login', 'email', 'createdAt'];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    queryBuilder
      .orderBy(`u.${safeSortBy}`, sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize);

    const [users, totalCount] = await queryBuilder.getManyAndCount();

    const items = users.map((user) => this._toUserView(user));

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  async getByIdOrNotFoundFail(id: string): Promise<IUserView> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this._toUserView(user);
  }

  private _toUserView(user: User): IUserView {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private _toUserView2(user: User): IUserView2 {
    return {
      userId: user.id,
      login: user.login,
      email: user.email,
    };
  }
}

