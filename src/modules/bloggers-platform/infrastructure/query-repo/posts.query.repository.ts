import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';

// import { Like, LikeStatus } from '../../models/like.model';
// import { IPagination } from '../../common/types/pagination';

import { Comment } from '../../domain/comment.entity';
import { CommentDB, CommentViewModel } from '../../dto/comments.dto';
import { SortQueryFilterType } from '../../../../common/types/sortQueryFilter.type';
import { IPagination } from '../../../../common/types/pagination';
import { Like, LikeStatus } from '../../domain/like.entity';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDB>,
    @InjectModel(Like.name)
    private readonly likeModel: Model<Like>,
  ) {}

  async findAllCommentsByPostId(
    postId: string,
    sortQueryDto: SortQueryFilterType,
    currentUserId?: string | null,
  ): Promise<IPagination<CommentViewModel[]>> {
    const { sortBy, sortDirection, pageSize, pageNumber } = sortQueryDto;

    const filter: any = { postId };

    const totalCount = await this.commentModel.countDocuments(filter);

    const comments = await this.commentModel
      .find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .select('-_id -__v')
      .lean();

    const items = await Promise.all(
      comments.map((comment) => this._getInViewComment(comment, currentUserId)),
    );

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  public async _getInViewComment(
    comment: CommentDB,
    currentUserId?: string | null,
  ): Promise<CommentViewModel> {
    const [likesCount, dislikesCount, myLike] = await Promise.all([
      this.likeModel.countDocuments({
        parentId: comment.id,
        parentType: 'Comment',
        status: LikeStatus.Like,
      }),
      this.likeModel.countDocuments({
        parentId: comment.id,
        parentType: 'Comment',
        status: LikeStatus.Dislike,
      }),
      currentUserId
        ? this.likeModel
            .findOne({
              parentId: comment.id,
              parentType: 'Comment',
              authorId: currentUserId,
            })
            .select('status')
            .lean()
        : null,
    ]);

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
        myStatus: myLike?.status ?? LikeStatus.None,
      },
    };
  }

  private _checkObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }
}
