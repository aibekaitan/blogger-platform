import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Post } from '../domain/post.entity';
import { Comment } from '../domain/comment.entity';
import { Like, LikeStatus } from '../domain/like.entity';
import { UsersRepository } from '../../user-accounts/infrastructure/users.repository';
import { PostInputModelType } from '../types/post.input.type';
import { CommentInputModel, CommentDB } from '../dto/comments.dto';
import { mapPostToView } from '../api/middlewares/posts.mapper';

@Injectable()
export class PostRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersRepository: UsersRepository,
  ) {}

  async findById(
    id: string,
    currentUserId?: string | null,
  ): Promise<Post | null> {
    const rows = await this.dataSource.query(
      `SELECT * FROM posts WHERE id = $1 LIMIT 1`,
      [id],
    );
    const post = rows[0];
    if (!post) return null;

    // парсим extendedLikesInfo
    const extendedLikesInfoFromDb =
      typeof post.extendedLikesInfo === 'string'
        ? JSON.parse(post.extendedLikesInfo)
        : post.extendedLikesInfo ?? { likesCount: 0, dislikesCount: 0, newestLikes: [] };

    // определяем мой статус
    let myStatus = LikeStatus.None;
    if (currentUserId) {
      const likeRows = await this.dataSource.query(
        `SELECT status FROM likes WHERE "parentType"='Post' AND "parentId"=$1 AND "authorId"=$2 LIMIT 1`,
        [id, currentUserId],
      );
      if (likeRows[0]) myStatus = likeRows[0].status;
    }

    return {
      ...post,
      extendedLikesInfo: {
        likesCount: extendedLikesInfoFromDb.likesCount ?? 0,
        dislikesCount: extendedLikesInfoFromDb.dislikesCount ?? 0,
        myStatus,
        newestLikes: extendedLikesInfoFromDb.newestLikes ?? [],
      },
    };
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
    const offset = (pageNumber - 1) * pageSize;

    // 1️⃣ Считаем общее количество постов
    const totalCountResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM posts`,
    );
    const totalCount = parseInt(totalCountResult[0].count, 10);

    // 2️⃣ Берём посты с сортировкой и пагинацией
    const posts = await this.dataSource.query(
      `
        SELECT * FROM posts
        ORDER BY "${sortBy}" ${sortDirection.toUpperCase()}
        OFFSET $1 LIMIT $2
      `,
      [offset, pageSize],
    );

    // 3️⃣ Собираем лайки текущего пользователя
    const userLikesMap = new Map<string, LikeStatus>();
    if (currentUserId) {
      const likes = await this.dataSource.query(
        `SELECT "parentId", status FROM likes WHERE "parentType"='Post' AND "authorId"=$1`,
        [currentUserId],
      );

      likes.forEach((like) => {
        userLikesMap.set(like.parentId.toString(), like.status);
      });
    }

    // 4️⃣ Формируем объект поста с корректным extendedLikesInfo
    const items = posts.map((post) => {
      const extendedLikesInfoFromDb =
        typeof post.extendedLikesInfo === 'string'
          ? JSON.parse(post.extendedLikesInfo)
          : post.extendedLikesInfo ?? { likesCount: 0, dislikesCount: 0, newestLikes: [] };

      // Убедимся, что newestLikes это массив и отсортирован по времени (desc)
      const newestLikes =
        Array.isArray(extendedLikesInfoFromDb.newestLikes)
          ? [...extendedLikesInfoFromDb.newestLikes].sort(
            (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
          )
          : [];

      return {
        ...post,
        extendedLikesInfo: {
          likesCount: extendedLikesInfoFromDb.likesCount ?? 0,
          dislikesCount: extendedLikesInfoFromDb.dislikesCount ?? 0,
          myStatus: currentUserId
            ? userLikesMap.get(post.id.toString()) ?? LikeStatus.None
            : LikeStatus.None,
          newestLikes,
        },
      };
    });

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items: items.map(mapPostToView),
    };
  }

  async create(dto: PostInputModelType, blogName: string): Promise<Post> {
    const id = uuidv4();
    const createdAt = new Date();

    await this.dataSource.query(
      `
      INSERT INTO posts (id, title, "shortDescription", content, "blogId", "blogName", "createdAt", "likesCount", "dislikesCount", "newestLikes")
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, '[]'::jsonb)
      `,
      [
        id,
        dto.title,
        dto.shortDescription,
        dto.content,
        dto.blogId,
        blogName,
        createdAt,
      ],
    );

    return {
      id,
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: dto.blogId,
      blogName,
      createdAt,
      extendedLikesInfo: { likesCount: 0, dislikesCount: 0, newestLikes: [] },
    } as unknown as Post;
  }

  async update(
    id: string,
    dto: PostInputModelType,
  ): Promise<{ matchedCount: number }> {
    const result = await this.dataSource.query(
      `
    UPDATE posts
    SET title=$1, "shortDescription"=$2, content=$3, "blogId"=$4
    WHERE id=$5
    RETURNING id
    `,
      [dto.title, dto.shortDescription, dto.content, dto.blogId, id],
    );

    return { matchedCount: result.length };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `DELETE FROM posts WHERE id=$1`,
      [id],
    );

    return result[1] > 0;
  }

  async createComment(
    dto: CommentInputModel,
    postId: string,
    userId: string,
  ): Promise<CommentDB> {
    const user = await this.usersRepository.findById(userId);
    const id = uuidv4();
    const createdAt = new Date();

    const comment: CommentDB = {
      id,
      content: dto.content,
      postId,
      commentatorInfo: { userId, userLogin: user?.login ?? '' },
      createdAt,
    };

    await this.dataSource.query(
      `INSERT INTO comments (id, content, "postId", "userId", "userLogin", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, dto.content, postId, userId, user?.login ?? '', createdAt],
    );

    return comment;
  }

  async setLikeStatus(postId: string, userId: string, likeStatus: LikeStatus) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Получаем предыдущий лайк пользователя
    const likeRows = await this.dataSource.query(
      `SELECT * FROM likes WHERE "parentType"='Post' AND "parentId"=$1 AND "authorId"=$2`,
      [postId, userId],
    );
    const prevStatus = likeRows[0]?.status ?? LikeStatus.None;

    if (prevStatus === likeStatus) return;

    // Получаем пост и его extendedLikesInfo
    const postRows = await this.dataSource.query(
      `SELECT * FROM posts WHERE id=$1`,
      [postId],
    );
    if (!postRows[0]) throw new NotFoundException('Post not found');
    const post = postRows[0];

    // Разбираем актуальный extendedLikesInfo
    let extendedLikesInfo = post.extendedLikesInfo ?? { likesCount: 0, dislikesCount: 0, newestLikes: [] };

    let { likesCount, dislikesCount, newestLikes } = extendedLikesInfo;

    // Обновляем счётчики за счёт предыдущего статуса
    if (prevStatus === LikeStatus.Like) {
      likesCount--;
      newestLikes = newestLikes.filter((l) => l.userId !== userId);
    }
    if (prevStatus === LikeStatus.Dislike) dislikesCount--;

    // Обновляем счётчики за счёт нового статуса
    if (likeStatus === LikeStatus.Like) {
      likesCount++;
      newestLikes.unshift({ addedAt: new Date(), userId, login: user.login });
      newestLikes = newestLikes.slice(0, 3); // только 3 последних
    }
    if (likeStatus === LikeStatus.Dislike) dislikesCount++;

    // Сохраняем обновлённую информацию
    await this.dataSource.query(
      `UPDATE posts SET "extendedLikesInfo"=$1 WHERE id=$2`,
      [JSON.stringify({ likesCount, dislikesCount, newestLikes }), postId],
    );

    // Работаем с таблицей likes
    if (likeStatus === LikeStatus.None) {
      await this.dataSource.query(
        `DELETE FROM likes WHERE "parentType"='Post' AND "parentId"=$1 AND "authorId"=$2`,
        [postId, userId],
      );
    } else {
      await this.dataSource.query(
        `
          INSERT INTO likes ("parentId","parentType","authorId","status","createdAt")
          VALUES ($1,'Post',$2,$3,$4)
            ON CONFLICT ("parentId","parentType","authorId") 
      DO UPDATE SET status=$3, "createdAt"=$4
        `,
        [postId, userId, likeStatus, new Date()],
      );
    }
  }
  async findOneByIds(blogId: string, postId: string): Promise<Post | null> {
    return this.dataSource.getRepository(Post).findOne({
      where: { id: postId, blogId },
    });
  }
  async save(post: Post) {
    return this.dataSource.getRepository(Post).save(post);
  }
}
