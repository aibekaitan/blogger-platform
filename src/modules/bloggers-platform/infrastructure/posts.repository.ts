import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// import { Post, PostDocument } from '../schemas/post.schema';
// import { Comment, CommentDocument } from '../../comments/schemas/comment.schema';
// import { Like, LikeDocument, LikeStatus } from '../../likes/schemas/like.schema';

import { PostPaginator } from '../types/paginator';
// import { PostInputModel } from '../dto/post.input';
// import { CommentInputModel, CommentDB } from '../../comments/types/comments.dto';

import { UpdateResult, DeleteResult } from 'mongodb';
import { UsersRepository } from '../../user-accounts/infrastructure/users.repository';
import { Post, PostDocument } from '../domain/post.entity';
import { Comment, CommentDocument } from '../domain/comment.entity';
import { Like, LikeDocument, LikeStatus } from '../domain/like.entity';
import { CommentDB, CommentInputModel } from '../dto/comments.dto';
import { PostType } from '../types/post';
import { PostInputModelType } from '../types/post.input.type';

@Injectable()
export class PostRepository {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,

    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,

    @InjectModel(Like.name)
    private readonly likeModel: Model<LikeDocument>,

    private readonly usersRepository: UsersRepository,
  ) {}

  async findAll(
    params: {
      pageNumber: number;
      pageSize: number;
      sortBy: string;
      sortDirection: string;
    },
    currentUserId?: string,
  ): Promise<PostPaginator> {
    const { pageNumber, pageSize, sortBy, sortDirection } = params;
    const direction = sortDirection === 'asc' ? 1 : -1;

    const totalCount = await this.postModel.countDocuments();

    const dbItems = await this.postModel
      .find({})
      .sort({ [sortBy]: direction })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const userLikesMap = new Map<string, LikeStatus>();

    if (currentUserId) {
      const userLikes = await this.likeModel
        .find({
          parentType: 'Post',
          authorId: currentUserId,
        })
        .select('parentId status')
        .lean();

      userLikes.forEach((like) => {
        userLikesMap.set(like.parentId, like.status as LikeStatus);
      });
    }

    const items = dbItems.map((post) => {
      const extendedLikesInfo = post.extendedLikesInfo ?? {
        likesCount: 0,
        dislikesCount: 0,
        newestLikes: [],
      };

      return {
        ...post,
        extendedLikesInfo: {
          likesCount: extendedLikesInfo.likesCount,
          dislikesCount: extendedLikesInfo.dislikesCount,
          myStatus: userLikesMap.get(post.id) ?? LikeStatus.None,
          newestLikes: [...extendedLikesInfo.newestLikes].reverse(),
        },
      };
    });

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  async findById(id: string, currentUserId?: string): Promise<PostType | null> {
    const dbPost = await this.postModel.findOne({ id }).lean();

    if (!dbPost) return null;

    let myStatus = LikeStatus.None;

    if (currentUserId) {
      const like = await this.likeModel
        .findOne({
          parentId: id,
          parentType: 'Post',
          authorId: currentUserId,
        })
        .lean();

      myStatus = (like?.status as LikeStatus) ?? LikeStatus.None;
    }

    return {
      ...dbPost,
      extendedLikesInfo: {
        likesCount: dbPost.extendedLikesInfo?.likesCount ?? 0,
        dislikesCount: dbPost.extendedLikesInfo?.dislikesCount ?? 0,
        myStatus,
        newestLikes: [
          ...(dbPost.extendedLikesInfo?.newestLikes ?? []),
        ].reverse(),
      },
    };
  }

  async create(dto: PostInputModelType, blogName: string): Promise<PostType> {
    const createdAt = new Date().toISOString();

    const post: PostType = {
      id: createdAt,
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName,
      createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
        newestLikes: [],
      },
    };

    await this.postModel.create(post);

    return {
      ...post,
      extendedLikesInfo: {
        ...post.extendedLikesInfo,
        myStatus: LikeStatus.None,
      },
    };
  }

  async createComment(
    dto: CommentInputModel,
    postId: string,
    userId: string,
  ): Promise<CommentDB> {
    const user = await this.usersRepository.findById(userId);

    const createdAt = new Date().toISOString();

    const comment: CommentDB = {
      id: createdAt,
      content: dto.content,
      postId,
      commentatorInfo: {
        userId,
        userLogin: user?.login,
      },
      createdAt,
    };

    await this.commentModel.create(comment);

    return comment;
  }

  async update(id: string, dto: PostInputModelType): Promise<UpdateResult> {
    return this.postModel.updateOne(
      { id },
      {
        $set: {
          title: dto.title,
          shortDescription: dto.shortDescription,
          content: dto.content,
          blogId: dto.blogId,
        },
      },
    );
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.postModel.deleteOne({ id });
  }

  async setLikeStatus(postId: string, userId: string, likeStatus: LikeStatus) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException();

    const likeDoc = await this.likeModel
      .findOne({
        parentId: postId,
        parentType: 'Post',
        authorId: userId,
      })
      .lean();

    const prevStatus = (likeDoc?.status as LikeStatus) ?? LikeStatus.None;

    if (prevStatus === likeStatus) return;

    const postUpdate: Record<string, unknown> = {};

    if (prevStatus === LikeStatus.Like) {
      postUpdate['$inc'] = { 'extendedLikesInfo.likesCount': -1 };
      postUpdate['$pull'] = { 'extendedLikesInfo.newestLikes': { userId } };
    }

    if (prevStatus === LikeStatus.Dislike) {
      postUpdate['$inc'] = { 'extendedLikesInfo.dislikesCount': -1 };
    }

    if (likeStatus === LikeStatus.Like) {
      postUpdate['$inc'] = {
        ...(postUpdate['$inc'] as object),
        'extendedLikesInfo.likesCount': 1,
      };

      postUpdate['$push'] = {
        'extendedLikesInfo.newestLikes': {
          $each: [
            {
              addedAt: new Date().toISOString(),
              userId,
              login: user.login,
            },
          ],
          $slice: -3,
        },
      };
    }

    if (likeStatus === LikeStatus.Dislike) {
      postUpdate['$inc'] = {
        ...(postUpdate['$inc'] as object),
        'extendedLikesInfo.dislikesCount': 1,
      };
    }

    if (Object.keys(postUpdate).length) {
      await this.postModel.updateOne({ id: postId }, postUpdate);
    }

    if (likeStatus === LikeStatus.None) {
      await this.likeModel.deleteOne({
        parentId: postId,
        parentType: 'Post',
        authorId: userId,
      });
    } else {
      await this.likeModel.updateOne(
        {
          parentId: postId,
          parentType: 'Post',
          authorId: userId,
        },
        {
          $set: {
            status: likeStatus,
            createdAt: new Date(),
          },
        },
        { upsert: true },
      );
    }
  }
}
