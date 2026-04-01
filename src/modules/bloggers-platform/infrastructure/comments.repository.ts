import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../domain/comment.entity';
import { Like, LikeStatus } from '../domain/like.entity';
import { CommentInputModel } from '../dto/comments.dto';
import { UsersRepository } from '../../user-accounts/infrastructure/users.repository';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(
    dto: CommentInputModel,
    postId: string,
    userId: string,
  ): Promise<Comment> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const comment = Comment.create({
      postId,
      content: dto.content,
      userId,
      userLogin: user.login,
    });

    return await this.commentsRepository.save(comment);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.commentsRepository.delete(id);
    return result.affected === 1;
  }

  async findById(id: string): Promise<Comment | null> {
    return await this.commentsRepository.findOneBy({ id });
  }

  async update(id: string, dto: CommentInputModel): Promise<boolean> {
    const comment = await this.findById(id);
    if (!comment) return false;

    comment.updateContent(dto.content);
    await this.commentsRepository.save(comment);
    return true;
  }

  async setLikeStatus(
    commentId: string,
    userId: string,
    likeStatus: LikeStatus,
  ): Promise<void> {
    if (likeStatus === LikeStatus.None) {
      await this.likesRepository.delete({
        parentId: commentId,
        parentType: 'Comment',
        authorId: userId,
      });
    } else {
      const like = Like.create({
        authorId: userId,
        parentId: commentId,
        status: likeStatus,
        parentType: 'Comment',
      });

      // Upsert based on unique index (authorId, parentId, parentType)
      await this.likesRepository.upsert(like, [
        'authorId',
        'parentId',
        'parentType',
      ]);
    }
  }
}
