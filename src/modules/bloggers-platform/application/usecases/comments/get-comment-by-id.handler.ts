// get-comment-by-id.query.ts

// get-comment-by-id.handler.ts
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { CommentRepository } from '../../../infrastructure/comments.repository';
import { PostQueryRepository } from '../../../infrastructure/query-repo/posts.query.repository';
import { CommentViewModel } from '../../../dto/comments.dto';

export class GetCommentByIdQuery extends Query<CommentViewModel | null> {
  constructor(
    public readonly commentId: string,
    public readonly currentUserId?: string,
  ) {
    super();
  }
}
@QueryHandler(GetCommentByIdQuery)
export class GetCommentByIdHandler implements IQueryHandler<
  GetCommentByIdQuery,
  CommentViewModel | null
> {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly postQueryRepository: PostQueryRepository,
  ) {}

  async execute(query: GetCommentByIdQuery): Promise<CommentViewModel | null> {
    const { commentId, currentUserId } = query;

    const comment = await this.commentRepository.findById(commentId);
    if (!comment) return null;

    return this.postQueryRepository._getInViewComment(comment, currentUserId);
  }
}
