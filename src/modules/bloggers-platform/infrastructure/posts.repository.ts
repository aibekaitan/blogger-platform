import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../domain/post.entity';
import { Comment } from '../domain/comment.entity';
import { Like, LikeStatus } from '../domain/like.entity';
import { UsersRepository } from '../../user-accounts/infrastructure/users.repository';
import { PostInputModelType } from '../types/post.input.type';
import { mapPostToView } from '../api/middlewares/posts.mapper';

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    private readonly usersRepository: UsersRepository,
  ) {}

  async findById(
    id: string,
    currentUserId?: string | null,
  ): Promise<Post | null> {
    const queryBuilder = this.postsRepository
      .createQueryBuilder('p')
      .where('p.id = :id', { id });

    if (currentUserId) {
      queryBuilder.addSelect((subQuery) => {
        return subQuery
          .select('l.status', 'myStatus')
          .from(Like, 'l')
          .where('l.parentId = p.id')
          .andWhere('l.parentType = :parentType', { parentType: 'Post' })
          .andWhere('l.authorId = :currentUserId', { currentUserId });
      }, 'myStatus');
    }

    const result = await queryBuilder.getRawAndEntities();
    const post = result.entities[0];
    const raw = result.raw[0];

    if (!post) return null;

    const myStatus = raw?.myStatus || LikeStatus.None;

    return {
      ...post,
      extendedLikesInfo: {
        ...post.extendedLikesInfo,
        myStatus,
      },
    } as any;
  }

  async findAll(
    params: {
      pageNumber: number;
      pageSize: number;
      sortBy: string;
      sortDirection: 'asc' | 'desc';
    },
    currentUserId?: string | null,
  ) {
    const { pageNumber, pageSize, sortBy, sortDirection } = params;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('p')
      .orderBy(`p.${sortBy}`, sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize);

    if (currentUserId) {
      queryBuilder
        .leftJoin(
          Like,
          'l',
          'l.parentId = p.id AND l.parentType = :parentType AND l.authorId = :currentUserId',
          { parentType: 'Post', currentUserId },
        )
        .addSelect('l.status', 'myStatus');
    }

    const result = await queryBuilder.getRawAndEntities();
    const posts = result.entities;
    const rawData = result.raw;

    const items = posts.map((post, index) => {
      const raw = rawData[index];
      const myStatus = raw?.myStatus || LikeStatus.None;

      return mapPostToView({
        ...post,
        extendedLikesInfo: {
          ...post.extendedLikesInfo,
          myStatus,
        },
      } as any);
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

  async create(dto: PostInputModelType, blogName: string): Promise<Post> {
    const post = Post.create({ ...dto, blogName });
    return await this.postsRepository.save(post);
  }

  async update(
    id: string,
    dto: PostInputModelType,
  ): Promise<{ matchedCount: number }> {
    const result = await this.postsRepository.update(id, {
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
    });
    return { matchedCount: result.affected || 0 };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.postsRepository.delete(id);
    return result.affected === 1;
  }

  async setLikeStatus(postId: string, userId: string, likeStatus: LikeStatus) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const post = await this.postsRepository.findOneBy({ id: postId });
    if (!post) throw new NotFoundException('Post not found');

    const prevLike = await this.likesRepository.findOneBy({
      parentId: postId,
      parentType: 'Post',
      authorId: userId,
    });
    const prevStatus = prevLike?.status ?? LikeStatus.None;

    if (prevStatus === likeStatus) return;

    let { likesCount, dislikesCount, newestLikes } = post.extendedLikesInfo;

    // Remove old status impact
    if (prevStatus === LikeStatus.Like) {
      likesCount--;
      newestLikes = newestLikes.filter((l) => l.userId !== userId);
    }
    if (prevStatus === LikeStatus.Dislike) dislikesCount--;

    // Add new status impact
    if (likeStatus === LikeStatus.Like) {
      likesCount++;
      newestLikes.unshift({
        addedAt: new Date().toISOString(),
        userId,
        login: user.login,
      });
      newestLikes = newestLikes.slice(0, 3);
    }
    if (likeStatus === LikeStatus.Dislike) dislikesCount++;

    // Update post JSONB
    post.updateLikesInfo(likesCount, dislikesCount, newestLikes);
    await this.postsRepository.save(post);

    // Update likes table
    if (likeStatus === LikeStatus.None) {
      await this.likesRepository.delete({
        parentId: postId,
        parentType: 'Post',
        authorId: userId,
      });
    } else {
      const like = Like.create({
        authorId: userId,
        parentId: postId,
        status: likeStatus,
        parentType: 'Post',
      });
      await this.likesRepository.upsert(like, [
        'authorId',
        'parentId',
        'parentType',
      ]);
    }
  }

  async findOneByIds(blogId: string, postId: string): Promise<Post | null> {
    return this.postsRepository.findOne({
      where: { id: postId, blogId },
    });
  }

  async save(post: Post) {
    return this.postsRepository.save(post);
  }
}
