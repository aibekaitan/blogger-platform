import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

import { UsersQueryRepository } from '../../infrastructure/query/users.query-repository';
import { IUserView } from '../../types/user.view.interface';
import { UsersQueryFieldsType } from '../../types/users.queryFields.type';
import { IPagination } from '../../../../common/types/pagination';

export class GetAllUsersQuery {
  constructor(public readonly query: UsersQueryFieldsType) {}
}
@QueryHandler(GetAllUsersQuery)
export class GetAllUsersHandler implements IQueryHandler<
  GetAllUsersQuery,
  IPagination<IUserView[]>
> {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute(query: GetAllUsersQuery): Promise<IPagination<IUserView[]>> {
    const { query: q } = query;

    return this.usersQueryRepository.findAllUsers({
      searchLoginTerm: q.searchLoginTerm,
      searchEmailTerm: q.searchEmailTerm,
      pageNumber: Number(q.pageNumber) || 1,
      pageSize: Number(q.pageSize) || 10,
      sortBy: q.sortBy ?? 'createdAt',
      sortDirection: q.sortDirection === 'asc' ? 1 : -1,
    });
  }
}
