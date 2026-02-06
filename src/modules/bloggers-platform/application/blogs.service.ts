import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { BlogInputModel } from '../dto/input-dto/blog.input';
import { PostInputModel } from '../dto/input-dto/post.input';
import { BaseQueryParams } from '../../../core/dto/base.query-params.input-dto';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class BlogsService {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async findById(id: string) {
    return this.blogsRepository.findById(id);
  }

  async findAllBlogs(params: {
    pageNumber: number;
    pageSize: number;
    sortBy: string;
    sortDirection: string;
    searchNameTerm?: string | null;
  }) {
    return this.blogsRepository.findAllBlogs(params);
  }

  async create(dto: BlogInputModel) {
    return this.blogsRepository.create({
      id: uuidv4(),
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
      createdAt: new Date().toISOString(),
      isMembership: false,
    });
  }

  async update(id: string, dto: BlogInputModel): Promise<boolean> {
    const blog = await this.blogsRepository.findOrNotFoundFail(id);

    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;

    await this.blogsRepository.save(blog);

    return true;
  }

  async delete(id: string) {
    return this.blogsRepository.delete(id);
  }


  async findPostsByBlogId(blogId: string, query: BaseQueryParams) {
    const result = await this.blogsRepository.findPostsByBlogId(blogId, {
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    });

    if (!result) {
      return {
        items: [],
      };
    }

    return result;
  }

  async createByBlogId(blogId: string, dto: PostInputModel) {
    const blog = await this.blogsRepository.findById(blogId);
    if (!blog) return null;

    return this.blogsRepository.createPostByBlogId(blog, dto);
  }
}
