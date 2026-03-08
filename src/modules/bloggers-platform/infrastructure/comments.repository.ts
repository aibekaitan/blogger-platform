import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CommentDB,
  CommentInputModel,
  CommentViewModel,
  LikesInfoViewModel,
} from '../dto/comments.dto';
import { LikeStatus } from '../domain/like.entity';
import { UsersRepository } from '../../user-accounts/infrastructure/users.repository';

@Injectable()
export class CommentRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(
    dto: CommentInputModel,
    postId: string,
    userId: string,
  ): Promise<CommentDB> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const id = crypto.randomUUID();
    const createdAt = new Date();

    await this.dataSource.query(
      `
      INSERT INTO comments(
        id,
        "postId",
        content,
        "userId",
        "userLogin",
        "createdAt"
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [id, postId, dto.content.trim(), userId, user.login, createdAt],
    );

    return {
      id,
      postId,
      content: dto.content.trim(),
      commentatorInfo: {
        userId,
        userLogin: user.login,
      },
      createdAt,
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `
      DELETE FROM comments
      WHERE id = $1
      `,
      [id],
    );

    return result.rowCount === 1;
  }

  async findById(id: string): Promise<CommentDB | null> {
    const result = await this.dataSource.query(
      `
      SELECT id,
             "postId",
             content,
             "userId",
             "userLogin",
             "createdAt"
      FROM comments
      WHERE id = $1
      `,
      [id],
    );

    if (!result.length) return null;

    const comment = result[0];

    return {
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt,
    };
  }

  async findByIdWithLikes(
    id: string,
    currentUserId?: string,
  ): Promise<CommentViewModel | null> {
    const comment = await this.findById(id);
    if (!comment) return null;

    const likesCount = await this.dataSource.query(
      `
      SELECT COUNT(*) 
      FROM likes
      WHERE "parentId" = $1
      AND "parentType" = 'Comment'
      AND status = 'Like'
      `,
      [id],
    );

    const dislikesCount = await this.dataSource.query(
      `
      SELECT COUNT(*) 
      FROM likes
      WHERE "parentId" = $1
      AND "parentType" = 'Comment'
      AND status = 'Dislike'
      `,
      [id],
    );

    let myStatus = LikeStatus.None;

    if (currentUserId) {
      const myLike = await this.dataSource.query(
        `
        SELECT status
        FROM likes
        WHERE "parentId"=$1
        AND "parentType"='Comment'
        AND "authorId"=$2
        `,
        [id, currentUserId],
      );

      if (myLike.length) {
        myStatus = myLike[0].status;
      }
    }

    const likesInfo: LikesInfoViewModel = {
      likesCount: Number(likesCount[0].count),
      dislikesCount: Number(dislikesCount[0].count),
      myStatus,
    };

    return {
      ...comment,
      likesInfo,
    };
  }

  async update(id: string, dto: CommentInputModel): Promise<boolean> {
    const result = await this.dataSource.query(
      `
      UPDATE comments
      SET content = $1
      WHERE id = $2
      `,
      [dto.content.trim(), id],
    );

    return result.rowCount === 1;
  }

  async setLikeStatus(
    commentId: string,
    userId: string,
    likeStatus: LikeStatus,
  ): Promise<void> {
    if (likeStatus === LikeStatus.None) {
      await this.dataSource.query(
        `
        DELETE FROM likes
        WHERE "parentId"=$1
        AND "parentType"='Comment'
        AND "authorId"=$2
        `,
        [commentId, userId],
      );
    } else {
      await this.dataSource.query(
        `
        INSERT INTO likes(
          id,
          "parentId",
          "parentType",
          "authorId",
          status,
          "createdAt"
        )
        VALUES ($1,$2,'Comment',$3,$4,$5)
        ON CONFLICT ("parentId","authorId")
        DO UPDATE SET
        status = $4,
        "createdAt" = $5
        `,
        [
          crypto.randomUUID(),
          commentId,
          userId,
          likeStatus,
          new Date(),
        ],
      );
    }
  }
}