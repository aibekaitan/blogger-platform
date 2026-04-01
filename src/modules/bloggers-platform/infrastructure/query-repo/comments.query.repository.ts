import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../domain/comment.entity';
import { Like, LikeStatus } from '../../domain/like.entity';
import { CommentViewModel } from '../../dto/comments.dto';
import { IPagination } from '../../../../common/types/pagination';
import { SortQueryFilterType } from '../../../../common/types/sortQueryFilter.type';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
  ) {}

  async findById(
    id: string,
    currentUserId?: string | null,
  ): Promise<CommentViewModel | null> {
    const comment = await this.commentsRepository.findOneBy({ id });

    if (!comment) return null;

    return this._mapToViewModel(comment, currentUserId);
  }

  async findAllByPostId(
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

    const skip = (pageNumber - 1) * pageSize;

    // Allowed sort fields
    const allowedSortFields = ['createdAt', 'content', 'userLogin'];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const queryBuilder = this.commentsRepository
      .createQueryBuilder('c')
      .where('c.postId = :postId', { postId })
      .orderBy(`c.${safeSortBy}`, sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .take(pageSize)
      .skip(skip);

    // Get counts and user status using subqueries or joins
    // Subqueries are easier for polymorphic relations in TypeORM sometimes
    queryBuilder.addSelect((subQuery) => {
      return subQuery
        .select('count(*)', 'likesCount')
        .from(Like, 'l')
        .where('l.parentId = c.id')
        .andWhere('l.parentType = :parentType', { parentType: 'Comment' })
        .andWhere('l.status = :likeStatus', { likeStatus: LikeStatus.Like });
    }, 'likesCount');

    queryBuilder.addSelect((subQuery) => {
      return subQuery
        .select('count(*)', 'dislikesCount')
        .from(Like, 'l')
        .where('l.parentId = c.id')
        .andWhere('l.parentType = :parentType', { parentType: 'Comment' })
        .andWhere('l.status = :dislikeStatus', {
          dislikeStatus: LikeStatus.Dislike,
        });
    }, 'dislikesCount');

    if (currentUserId) {
      queryBuilder.addSelect((subQuery) => {
        return subQuery
          .select('l.status', 'myStatus')
          .from(Like, 'l')
          .where('l.parentId = c.id')
          .andWhere('l.parentType = :parentType', { parentType: 'Comment' })
          .andWhere('l.authorId = :currentUserId', { currentUserId });
      }, 'myStatus');
    }

    const result = await queryBuilder.getRawAndEntities();
    const comments = result.entities;
    const rawData = result.raw;

    const items = comments.map((comment, index) => {
      const raw = rawData[index];
      return {
        id: comment.id,
        content: comment.content,
        commentatorInfo: {
          userId: comment.userId,
          userLogin: comment.userLogin,
        },
        createdAt: comment.createdAt,
        likesInfo: {
          likesCount: Number(raw.likesCount) || 0,
          dislikesCount: Number(raw.dislikesCount) || 0,
          myStatus: raw.myStatus || LikeStatus.None,
        },
      };
    });

    const totalCount = await queryBuilder.getCount();

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  async _mapToViewModel(
    comment: Comment,
    currentUserId?: string | null,
  ): Promise<CommentViewModel> {
    const [likesCount, dislikesCount, myLike] = await Promise.all([
      this.likesRepository.countBy({
        parentId: comment.id,
        parentType: 'Comment',
        status: LikeStatus.Like,
      }),
      this.likesRepository.countBy({
        parentId: comment.id,
        parentType: 'Comment',
        status: LikeStatus.Dislike,
      }),
      currentUserId
        ? this.likesRepository.findOneBy({
            parentId: comment.id,
            parentType: 'Comment',
            authorId: currentUserId,
          })
        : Promise.resolve(null),
    ]);

    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount,
        dislikesCount,
        myStatus: myLike ? myLike.status : LikeStatus.None,
      },
    };
  }
}
