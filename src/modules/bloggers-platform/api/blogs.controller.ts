// src/bloggers-platform/blogs.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from '../application/blogs.service'; // подправь путь
import { BlogInputModel } from '../dto/input-dto/blog.input';
// import { BlogViewModel } from './types/blog.view'; // или твой view model
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseQueryParams } from '../../../core/dto/base.query-params.input-dto';
import { PostInputModel } from '../dto/input-dto/post.input';
import { mapBlogToView } from './middlewares/blog.mapper';
import { mapPostToView } from './middlewares/posts.mapper';
import { NoRateLimit } from '../../../common/decorators/no-rate-limit.decorator';
// import { JwtAuthGuard } from '../../user-accounts/api/guards/jwt-auth.guard';
import { BasicAuthGuard } from '../../user-accounts/api/guards/basic-auth.guard';
import { OptionalJwtAuthGuard } from '../../user-accounts/api/guards/optional-jwt-auth.guard';
import { CreatePostForBlogInputModel } from '../dto/input-dto/create-post-for-blog.input';
@NoRateLimit()
@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all blogs with pagination' })
  @ApiResponse({ status: 200, description: 'Blogs returned' })
  async getAllBlogs(@Query() queryParams: BaseQueryParams) {
    const { pageNumber, pageSize, sortBy, sortDirection } = queryParams;

    const skip = queryParams.calculateSkip();
    const sort = queryParams.getSortObject();

    const searchNameTerm = queryParams.searchNameTerm || null;

    const result = await this.blogsService.findAllBlogs({
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      searchNameTerm,
    });

    return result; // { pagesCount, page, pageSize, totalCount, items }
  }
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/posts')
  @ApiOperation({ summary: 'Get posts for specific blog' })
  async getPostsByBlogId(
    @Param('id') blogId: string,
    @Query() queryParams: BaseQueryParams,
  ) {
    const blog = await this.blogsService.findById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    const result = await this.blogsService.findPostsByBlogId(
      blogId,
      queryParams,
    );

    if (result.items.length === 0) {
      throw new NotFoundException('Blog not found');
    }

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blog by id' })
  async getBlogById(@Param('id') id: string) {
    const blog = await this.blogsService.findById(id);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return mapBlogToView(blog);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new blog' })
  async createBlog(@Body() createBlogDto: BlogInputModel) {
    return await this.blogsService.create(createBlogDto);
  }

  @UseGuards(BasicAuthGuard)
  @Post(':blogId/posts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create post for specific blog' })
  async createPostByBlogId(
    @Param('blogId') blogId: string,
    @Body() createPostDto: CreatePostForBlogInputModel,
  ) {
    const blog = await this.blogsService.findById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    const newPost = mapPostToView(
      await this.blogsService.createByBlogId(blogId, createPostDto),
    );

    if (!newPost) {
      throw new NotFoundException('Blog not found');
    }

    return newPost;
  }

  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update blog by id' })
  async updateBlogById(
    @Param('id') id: string,
    @Body() updateBlogDto: BlogInputModel,
  ) {
    const updated = await this.blogsService.update(id, updateBlogDto);

    if (!updated) {
      throw new NotFoundException('Blog not found');
    }

    return; // 204 No Content
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete blog by id' })
  async deleteBlog(@Param('id') id: string) {
    const deleted = await this.blogsService.delete(id);

    if (!deleted) {
      throw new NotFoundException('Blog not found');
    }

    return; // 204 No Content
  }
}
