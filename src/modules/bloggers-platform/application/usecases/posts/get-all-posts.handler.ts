// get-all-posts.query.ts
import { Query } from '@nestjs/cqrs';

// get-all-posts.handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../../infrastructure/posts.repository';

export class GetAllPostsQuery extends Query<any> {
  constructor(
    public readonly query: any,
    public readonly currentUserId?: string | null,
  ) {
    super();
  }
}
@QueryHandler(GetAllPostsQuery)
export class GetAllPostsHandler implements IQueryHandler<GetAllPostsQuery> {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(query: GetAllPostsQuery) {
    const { query: q, currentUserId } = query;

    const pageNumber = Number(q.pageNumber) || 1;
    const pageSize = Number(q.pageSize) || 10;
    const sortBy = (q.sortBy as string) || 'createdAt';
    const sortDirection = q.sortDirection === 'asc' ? 'asc' : 'desc';

    return this.postRepository.findAll(
      { pageNumber, pageSize, sortBy, sortDirection },
      currentUserId,
    );
  }
}
