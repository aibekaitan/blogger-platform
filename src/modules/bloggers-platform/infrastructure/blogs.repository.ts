import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from '../domain/blog.entity';
import { Post } from '../domain/post.entity';
import { Like, LikeStatus } from '../domain/like.entity';
import { mapBlogToView } from '../api/middlewares/blog.mapper';
import { mapPostToView } from '../api/middlewares/posts.mapper';
import { CreatePostForBlogInputModel } from '../dto/input-dto/create-post-for-blog.input';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectRepository(Blog)
    private readonly blogsRepository: Repository<Blog>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Like)
    private readonly likesRepository: Repository<Like>,
  ) {}

  async findById(id: string): Promise<Blog | null> {
    return await this.blogsRepository.findOneBy({ id });
  }

  async findOrNotFoundFail(id: string): Promise<Blog> {
    const blog = await this.findById(id);
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async save(blog: Blog): Promise<void> {
    await this.blogsRepository.save(blog);
  }

  async create(blogData: {
    name: string;
    description: string;
    websiteUrl: string;
  }): Promise<Blog> {
    const blog = Blog.create(blogData);
    return await this.blogsRepository.save(blog);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.blogsRepository.delete(id);
    return result.affected === 1;
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

    const queryBuilder = this.blogsRepository.createQueryBuilder('b');

    if (searchNameTerm) {
      queryBuilder.where('b.name ILIKE :name', { name: `%${searchNameTerm}%` });
    }

    queryBuilder.orderBy(
      `b.${sortBy}`,
      sortDirection.toUpperCase() as 'ASC' | 'DESC',
    );
    queryBuilder.skip((pageNumber - 1) * pageSize).take(pageSize);

    const [items, totalCount] = await queryBuilder.getManyAndCount();

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

    const { pageNumber, pageSize, sortBy, sortDirection } = params;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('p')
      .where('p.blogId = :blogId', { blogId })
      .orderBy(`p.${sortBy}`, sortDirection.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize);

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
    const posts = result.entities;
    const rawData = result.raw;

    const items = posts.map((post, index) => {
      const raw = rawData[index];
      const myStatus = raw.myStatus || LikeStatus.None;

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

  async createPostByBlogId(
    blog: Blog,
    dto: CreatePostForBlogInputModel,
  ): Promise<Post> {
    const post = Post.create({
      ...dto,
      blogId: blog.id,
      blogName: blog.name,
    });
    return await this.postsRepository.save(post);
  }
}
