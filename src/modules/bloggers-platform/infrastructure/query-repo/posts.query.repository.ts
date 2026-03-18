import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CommentViewModel } from '../../dto/comments.dto';
import { SortQueryFilterType } from '../../../../common/types/sortQueryFilter.type';
import { IPagination } from '../../../../common/types/pagination';
import { LikeStatus } from '../../domain/like.entity';

@Injectable()
export class PostQueryRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findAllCommentsByPostId(
    postId: string,
    sortQueryDto: SortQueryFilterType,
    currentUserId?: string | null,
  ): Promise<IPagination<CommentViewModel[]>> {
    const {
      sortBy = 'createdAt',
      sortDirection = 'desc',
      pageSize = 10,
      pageNumber = 1,
    } = sortQueryDto;

    // ✅ направление
    const direction = sortDirection === 'desc' ? 'DESC' : 'ASC';

    // ✅ whitelist (как у users)
    const allowedSortFields = ['createdAt', 'content', 'userLogin'];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const offset = (pageNumber - 1) * pageSize;

    // ✅ COUNT
    const totalCountResult = await this.dataSource.query(
      `
    SELECT COUNT(*) as total
    FROM comments
    WHERE "postId" = $1
    `,
      [postId],
    );

    const totalCount = Number(totalCountResult[0]?.total ?? 0);

    // ✅ MAIN QUERY
    const comments = await this.dataSource.query(
      `
    SELECT 
      c.id,
      c.content,
      c."userId",
      c."userLogin",
      c."createdAt"
    FROM comments c
    WHERE c."postId" = $1
    ORDER BY c."${safeSortBy}" ${direction}
    LIMIT $2 OFFSET $3
    `,
      [postId, pageSize, offset],
    );

    const items = await Promise.all(
      comments.map((comment) =>
        this._getInViewComment(comment, currentUserId),
      ),
    );

    return {
      pagesCount: totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0,
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  async _getInViewComment(
    comment: any,
    currentUserId?: string | null,
  ): Promise<CommentViewModel> {
    const [likesCountResult, dislikesCountResult, myLikeResult] =
      await Promise.all([
        this.dataSource.query(
          `
          SELECT COUNT(*) FROM likes
          WHERE "parentId" = $1
          AND "parentType" = 'Comment'
          AND status = 'Like'
          `,
          [comment.id],
        ),

        this.dataSource.query(
          `
          SELECT COUNT(*) FROM likes
          WHERE "parentId" = $1
          AND "parentType" = 'Comment'
          AND status = 'Dislike'
          `,
          [comment.id],
        ),

        currentUserId
          ? this.dataSource.query(
            `
              SELECT status FROM likes
              WHERE "parentId" = $1
              AND "parentType" = 'Comment'
              AND "authorId" = $2
              `,
            [comment.id, currentUserId],
          )
          : Promise.resolve([]),
      ]);

    const likesCount = Number(likesCountResult[0].count);
    const dislikesCount = Number(dislikesCountResult[0].count);

    const myStatus =
      myLikeResult.length > 0
        ? myLikeResult[0].status
        : LikeStatus.None;

    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId,
        userLogin: comment.commentatorInfo.userLogin ?? 'Deleted user',
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount,
        dislikesCount,
        myStatus,
      },
    };
  }
}