import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { CommentsQueryRepository } from '../../../infrastructure/query-repo/comments.query.repository';
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
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  async execute(query: GetCommentByIdQuery): Promise<CommentViewModel | null> {
    const { commentId, currentUserId } = query;
    return this.commentsQueryRepository.findById(commentId, currentUserId);
  }
}
