// src/comments/infrastructure/comment.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CommentDB,
  CommentInputModel,
  CommentViewModel,
  LikesInfoViewModel,
} from '../dto/comments.dto';
import { Comment, CommentDocument } from '../domain/comment.entity';
import { Like, LikeDocument, LikeStatus } from '../domain/like.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,

    @InjectModel(Like.name)
    private readonly likeModel: Model<LikeDocument>,
  ) {}

  // Новый метод: создание комментария
  async create(
    dto: CommentInputModel,
    postId: string,
    userId: string,
    userLogin: string, // нужно передать login пользователя
  ): Promise<CommentDB> {
    const newComment = new this.commentModel({
      id: crypto.randomUUID(), // или используй uuid.v4() если импортируешь
      postId,
      content: dto.content.trim(),
      commentatorInfo: {
        userId,
        userLogin,
      },
      createdAt: new Date().toISOString(),
    });

    await newComment.save();

    // Возвращаем lean-версию без лишних полей Mongoose
    return newComment.toObject({
      versionKey: false,
      transform: (doc, ret) => {
        return ret;
      },
    }) as CommentDB;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.commentModel.deleteOne({ id }).exec();
    return result.deletedCount === 1;
  }

  async findById(id: string): Promise<CommentDB | null> {
    return this.commentModel.findOne({ id }).select('-__v').lean().exec();
  }

  async findByIdWithLikes(
    id: string,
    currentUserId?: string,
  ): Promise<CommentViewModel | null> {
    const comment = await this.commentModel
      .findOne({ id })
      .select('-__v')
      .lean()
      .exec();

    if (!comment) return null;

    const [likesCount, dislikesCount, myLike] = await Promise.all([
      this.likeModel.countDocuments({
        parentId: id,
        parentType: 'Comment',
        status: LikeStatus.Like,
      }),
      this.likeModel.countDocuments({
        parentId: id,
        parentType: 'Comment',
        status: LikeStatus.Dislike,
      }),
      currentUserId
        ? this.likeModel
            .findOne({
              parentId: id,
              parentType: 'Comment',
              authorId: currentUserId,
            })
            .lean()
        : null,
    ]);

    const likesInfo: LikesInfoViewModel = {
      likesCount,
      dislikesCount,
      myStatus: myLike?.status || LikeStatus.None,
    };

    return {
      ...comment,
      likesInfo,
    } as CommentViewModel;
  }

  async update(id: string, dto: CommentInputModel): Promise<void> {
    await this.commentModel
      .updateOne({ id }, { $set: { content: dto.content.trim() } })
      .exec();
  }

  async setLikeStatus(
    commentId: string,
    userId: string,
    likeStatus: LikeStatus,
  ): Promise<void> {
    if (likeStatus === LikeStatus.None) {
      await this.likeModel
        .deleteOne({
          parentId: commentId,
          parentType: 'Comment',
          authorId: userId,
        })
        .exec();
    } else {
      await this.likeModel
        .updateOne(
          { parentId: commentId, parentType: 'Comment', authorId: userId },
          { $set: { status: likeStatus, createdAt: new Date() } },
          { upsert: true },
        )
        .exec();
    }
  }
}
