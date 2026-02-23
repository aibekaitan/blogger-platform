// get-blog-by-id.query.ts

// get-blog-by-id.handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { Query } from '@nestjs/cqrs';
import { BlogsRepository } from '../../../infrastructure/blogs.repository';

export class GetBlogByIdQuery extends Query<any> {
  constructor(public readonly id: string) {
    super();
  }
}

@QueryHandler(GetBlogByIdQuery)
export class GetBlogByIdHandler implements IQueryHandler<GetBlogByIdQuery> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(query: GetBlogByIdQuery) {
    const blog = await this.blogsRepository.findById(query.id);
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }
}
