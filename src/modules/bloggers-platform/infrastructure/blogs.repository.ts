import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Blog, BlogDocument } from '../domain/blog.entity';
import type { BlogModelType } from '../domain/blog.entity';
import { Post, PostDocument } from '../domain/post.entity';
import type { PostModelType } from '../domain/post.entity';
import { PostInputModel } from '../dto/input-dto/post.input';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class BlogsRepository {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    @InjectModel(Post.name) private PostModel: PostModelType,
  ) {}

  async findById(id: string): Promise<BlogDocument | null> {
    return this.BlogModel.findOne({ id });
  }

  async findOrNotFoundFail(id: string): Promise<BlogDocument> {
    const blog = await this.findById(id);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return blog;
  }

  async save(blog: BlogDocument) {
    await blog.save();
  }

  async create(blog: Partial<Blog>): Promise<BlogDocument> {
    const newBlog = new this.BlogModel(blog);
    return newBlog.save();
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.BlogModel.deleteOne({ id });
    return res.deletedCount === 1;
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

    const direction = sortDirection === 'asc' ? 1 : -1;

    const filter = searchNameTerm
      ? { name: { $regex: searchNameTerm, $options: 'i' } }
      : {};

    const totalCount = await this.BlogModel.countDocuments(filter);

    const items = await this.BlogModel.find(filter)
      .sort({ [sortBy]: direction })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  async findPostsByBlogId(
    blogId: string,
    params: {
      pageNumber: number;
      pageSize: number;
      sortBy: string;
      sortDirection: string;
    },
  ) {
    const blogExists = await this.findById(blogId);
    if (!blogExists) return null;

    const direction = params.sortDirection === 'asc' ? 1 : -1;

    const filter = { blogId };

    const totalCount = await this.PostModel.countDocuments(filter);

    const items = await this.PostModel.find(filter)
      .sort({ [params.sortBy]: direction })
      .skip((params.pageNumber - 1) * params.pageSize)
      .limit(params.pageSize);

    return {
      pagesCount: Math.ceil(totalCount / params.pageSize),
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
      items,
    };
  }

  async createPostByBlogId(
    blog: BlogDocument,
    dto: PostInputModel,
  ): Promise<PostDocument> {
    const post = new this.PostModel({
      id: uuidv4(),
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: blog.id,
      blogName: blog.name,
      createdAt: new Date().toISOString(),
    });

    return post.save();
  }
}
