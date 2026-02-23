// get-post-by-id.query.ts
import { Query } from '@nestjs/cqrs';

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../../infrastructure/posts.repository';
import { mapPostToView } from '../../../api/middlewares/posts.mapper';

export class GetPostByIdQuery extends Query<any> {
  constructor(
    public readonly postId: string,
    public readonly currentUserId?: string | null,
  ) {
    super();
  }
}
@QueryHandler(GetPostByIdQuery)
export class GetPostByIdHandler implements IQueryHandler<GetPostByIdQuery> {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(query: GetPostByIdQuery) {
    const { postId, currentUserId } = query;

    const post = await this.postRepository.findById(postId, currentUserId);
    if (!post) return null;

    return mapPostToView(post);
  }
}
