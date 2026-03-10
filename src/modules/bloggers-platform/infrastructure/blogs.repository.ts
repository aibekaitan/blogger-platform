// blogs.repository.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Blog } from '../domain/blog.entity';
import { Post } from '../domain/post.entity';
import { Like, LikeStatus } from '../domain/like.entity';
import { mapBlogToView } from '../api/middlewares/blog.mapper';
import { mapPostToView } from '../api/middlewares/posts.mapper';
import { CreatePostForBlogInputModel } from '../dto/input-dto/create-post-for-blog.input';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BlogsRepository {
  constructor(private dataSource: DataSource) {}

  async findById(id: string): Promise<Blog | null> {
    const rows = await this.dataSource.query(
      `SELECT * FROM blogs WHERE id = $1 LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findOrNotFoundFail(id: string): Promise<Blog> {
    const blog = await this.findById(id);
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async save(blog: Blog): Promise<void> {
    await this.dataSource.query(
      `
        UPDATE blogs
        SET name = $1, description = $2, "websiteUrl" = $3
        WHERE id = $4
      `,
      [blog.name, blog.description, blog.websiteUrl, blog.id],
    );
  }

  async create(blogData: {
    name: string;
    description: string;
    websiteUrl: string;
  }): Promise<Blog> {



    const id = uuidv4();
    const createdAt = new Date();

    await this.dataSource.query(
      `INSERT INTO blogs (id, name, description, "websiteUrl", "createdAt", "isMembership")
     VALUES ($1, $2, $3, $4, $5, false)`,
      [id, blogData.name.trim(), blogData.description.trim(), blogData.websiteUrl, createdAt],
    );


    return {
      id,
      name: blogData.name.trim(),
      description: blogData.description.trim(),
      websiteUrl: blogData.websiteUrl,
      createdAt,
      isMembership: false,
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `DELETE FROM blogs WHERE id = $1::uuid RETURNING id`,
      [id],
    );
    return result[1]>0;
  }
  async findAllBlogs(params: {
    pageNumber: number;
    pageSize: number;
    sortBy: string;
    sortDirection: string;
    searchNameTerm?: string | null;
  }) {
    const { pageNumber, pageSize, sortBy, sortDirection, searchNameTerm } =
      params;

    const filterQuery = searchNameTerm
      ? `WHERE name ILIKE '%' || $1 || '%'`
      : '';
    const filterParam = searchNameTerm ? [searchNameTerm] : [];

    const totalCountResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM blogs ${filterQuery}`,
      filterParam,
    );
    const totalCount = parseInt(totalCountResult[0].count, 10);

    const offset = (pageNumber - 1) * pageSize;

    const items = await this.dataSource.query(
      `
        SELECT *
        FROM blogs
               ${filterQuery}
        ORDER BY "${sortBy}" ${sortDirection.toUpperCase()}
        OFFSET $${filterParam.length + 1} LIMIT $${filterParam.length + 2}
      `,
      [...filterParam, offset, pageSize],
    );

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items: items.map(mapBlogToView),
    };
  }

  async findPostsByBlogId(
    blogId: string,
    params: {
      pageNumber: number;
      pageSize: number;
      sortBy: string;
      sortDirection: 'asc' | 'desc';
    },
    currentUserId?: string | null,
  ) {
    const blog = await this.findById(blogId);
    if (!blog) return null;

    const totalCountResult = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM posts WHERE "blogId" = $1`,
      [blogId],
    );
    const totalCount = parseInt(totalCountResult[0].count, 10);

    const offset = (params.pageNumber - 1) * params.pageSize;

    const posts = await this.dataSource.query(
      `
        SELECT *
        FROM posts
        WHERE "blogId" = $1
        ORDER BY "${params.sortBy}" ${params.sortDirection.toUpperCase()}
        OFFSET $2 LIMIT $3
      `,
      [blogId, offset, params.pageSize],
    );


    const userLikesMap = new Map<string, LikeStatus>();
    if (currentUserId) {
      const likes = await this.dataSource.query(
        `SELECT "parentId", status FROM likes WHERE "parentType"='Post' AND "authorId"=$1`,
        [currentUserId],
      );
      likes.forEach((like) => userLikesMap.set(like.parentId, like.status));
    }

    const items = posts.map((post) => ({
      ...post,
      extendedLikesInfo: {
        likesCount: post.likesCount ?? 0,
        dislikesCount: post.dislikesCount ?? 0,
        myStatus: userLikesMap.get(post.id) ?? LikeStatus.None,
        newestLikes: post.newestLikes ?? [],
      },
    }));

    return {
      pagesCount: Math.ceil(totalCount / params.pageSize),
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
      items: items.map(mapPostToView),
    };
  }

  async createPostByBlogId(
    blog: Blog,
    dto: CreatePostForBlogInputModel,
  ): Promise<Post> {
    const id = uuidv4();
    const createdAt = new Date();

    await this.dataSource.query(
      `INSERT INTO posts
       (id, title, "shortDescription", content, "blogId", "blogName", "createdAt", "extendedLikesInfo")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        id,
        dto.title,
        dto.shortDescription,
        dto.content,
        blog.id,
        blog.name,
        createdAt,
        JSON.stringify({ likesCount: 0, dislikesCount: 0, newestLikes: [] }),
      ],
    );

    return {
      id,
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: blog.id,
      blogName: blog.name,
      createdAt,
      extendedLikesInfo: { likesCount: 0, dislikesCount: 0, newestLikes: [] },
    } as unknown as Post;
  }
}
