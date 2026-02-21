import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Query } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../infrastructure/query/users.query-repository';

export class GetMeQuery extends Query<{
  email: string;
  login: string;
  userId: string;
}> {
  constructor(public readonly userId: string) {
    super();
  }
}

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<
  GetMeQuery,
  { email: string; login: string; userId: string }
> {
  constructor(private readonly usersQueryRepo: UsersQueryRepository) {}

  async execute(query: GetMeQuery) {
    const { userId } = query;
    if (!userId) throw new UnauthorizedException();

    const user = await this.usersQueryRepo.getByIdOrNotFoundFail(userId);
    return {
      email: user.email,
      login: user.login,
      userId: user.id.toString(),
    };
  }
}
