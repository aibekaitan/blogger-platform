// get-posts-by-blog-id.query.ts

// get-posts-by-blog-id.handler.ts
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';

export class GetPostsByBlogIdQuery extends Query<any> {
  constructor(
    public readonly blogId: string,
    public readonly queryParams: BaseQueryParams,
    public readonly currentUserId?: string | null,
  ) {
    super();
  }
}
@QueryHandler(GetPostsByBlogIdQuery)
export class GetPostsByBlogIdHandler implements IQueryHandler<GetPostsByBlogIdQuery> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(query: GetPostsByBlogIdQuery) {
    const { blogId, queryParams, currentUserId } = query;

    const result = await this.blogsRepository.findPostsByBlogId(
      blogId,
      {
        pageNumber: queryParams.pageNumber,
        pageSize: queryParams.pageSize,
        sortBy: queryParams.sortBy,
        sortDirection: queryParams.sortDirection,
      },
      currentUserId,
    );

    return result || { items: [] };
  }
}
