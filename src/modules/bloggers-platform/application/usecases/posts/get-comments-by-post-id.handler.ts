import { Query } from '@nestjs/cqrs';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { CommentViewModel } from '../../../dto/comments.dto';
import { IPagination } from '../../../../../common/types/pagination';
import { CommentsQueryFieldsType } from '../../../types/comments.queryFields.type';
import { PostRepository } from '../../../infrastructure/posts.repository';
import { CommentsQueryRepository } from '../../../infrastructure/query-repo/comments.query.repository';
import { sortQueryFieldsUtil } from '../../../../../common/utils/sortQueryFields.util';

export class GetCommentsByPostIdQuery extends Query<
  IPagination<CommentViewModel[]>
> {
  constructor(
    public readonly postId: string,
    public readonly query: CommentsQueryFieldsType,
    public readonly currentUserId?: string | null,
  ) {
    super();
  }
}

@QueryHandler(GetCommentsByPostIdQuery)
export class GetCommentsByPostIdHandler implements IQueryHandler<
  GetCommentsByPostIdQuery,
  IPagination<CommentViewModel[]>
> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  async execute(query: GetCommentsByPostIdQuery) {
    const { postId, query: q, currentUserId } = query;

    const postExists = await this.postRepository.findById(postId);
    if (!postExists) {
      throw new NotFoundException('Post not found');
    }

    const { pageNumber, pageSize, sortBy, sortDirection } =
      sortQueryFieldsUtil(q);

    return this.commentsQueryRepository.findAllByPostId(
      postId,
      { pageNumber, pageSize, sortBy, sortDirection },
      currentUserId,
    );
  }
}
