import { Query } from '@nestjs/cqrs';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';

export class GetAllBlogsQuery extends Query<any> {
  constructor(
    public readonly pageNumber: number,
    public readonly pageSize: number,
    public readonly sortBy: string,
    public readonly sortDirection: string,
    public readonly searchNameTerm?: string | null,
  ) {
    super();
  }
}

@QueryHandler(GetAllBlogsQuery)
export class GetAllBlogsHandler implements IQueryHandler<GetAllBlogsQuery> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(query: GetAllBlogsQuery) {
    return this.blogsRepository.findAllBlogs({
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      searchNameTerm: query.searchNameTerm,
    });
  }
}
