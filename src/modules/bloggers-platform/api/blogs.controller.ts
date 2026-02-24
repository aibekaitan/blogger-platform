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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { BlogInputModel } from '../dto/input-dto/blog.input';
import { CreatePostForBlogInputModel } from '../dto/input-dto/create-post-for-blog.input';
import { BaseQueryParams } from '../../../core/dto/base.query-params.input-dto';

import { NoRateLimit } from '../../../common/decorators/no-rate-limit.decorator';
import { BasicAuthGuard } from '../../user-accounts/api/guards/basic-auth.guard';
import { OptionalJwtAuthGuard } from '../../user-accounts/api/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtUser } from './posts.controller';

import { mapBlogToView } from './middlewares/blog.mapper';
import { mapPostToView } from './middlewares/posts.mapper';
import { GetAllBlogsQuery } from '../application/usecases/blogs/get-all-blogs.handler';
import { GetPostsByBlogIdQuery } from '../application/usecases/blogs/get-posts-by-blog-id.handler';
import { GetBlogByIdQuery } from '../application/usecases/blogs/get-blog-by-id.handler';
import { CreateBlogCommand } from '../application/usecases/blogs/create-blog.handler';
import { CreatePostForBlogCommand } from '../application/usecases/blogs/create-post-for-blog.handler';
import { UpdateBlogCommand } from '../application/usecases/blogs/update-blog.handler';
import { DeleteBlogCommand } from '../application/usecases/blogs/delete-blog.handler';

@NoRateLimit()
@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all blogs with pagination' })
  @ApiResponse({ status: 200, description: 'Blogs returned' })
  async getAllBlogs(@Query() queryParams: BaseQueryParams) {
    const { pageNumber, pageSize, sortBy, sortDirection, searchNameTerm } =
      queryParams;

    return this.queryBus.execute(
      new GetAllBlogsQuery(
        pageNumber,
        pageSize,
        sortBy,
        sortDirection,
        searchNameTerm || null,
      ),
    );
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/posts')
  @ApiOperation({ summary: 'Get posts for specific blog' })
  async getPostsByBlogId(
    @Param('id') blogId: string,
    @Query() queryParams: BaseQueryParams,
    @CurrentUser() currentUser?: JwtUser | null,
  ) {
    const userId = currentUser?.id ?? null;

    const result = await this.queryBus.execute(
      new GetPostsByBlogIdQuery(blogId, queryParams, userId),
    );

    if (!result || result.items.length === 0) {
      throw new NotFoundException('Blog not found');
    }

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get blog by id' })
  async getBlogById(@Param('id') id: string) {
    const blog = await this.queryBus.execute(new GetBlogByIdQuery(id));

    return mapBlogToView(blog);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new blog' })
  async createBlog(@Body() createBlogDto: BlogInputModel) {
    return this.commandBus.execute(new CreateBlogCommand(createBlogDto));
  }

  @UseGuards(BasicAuthGuard)
  @Post(':blogId/posts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create post for specific blog' })
  async createPostByBlogId(
    @Param('blogId') blogId: string,
    @Body() createPostDto: CreatePostForBlogInputModel,
  ) {
    const newPost = await this.commandBus.execute(
      new CreatePostForBlogCommand(blogId, createPostDto),
    );
    return mapPostToView(newPost);
  }

  @UseGuards(BasicAuthGuard)
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update blog by id' })
  async updateBlogById(
    @Param('id') id: string,
    @Body() updateBlogDto: BlogInputModel,
  ) {
    const updated = await this.commandBus.execute(
      new UpdateBlogCommand(id, updateBlogDto),
    );

    if (!updated) {
      throw new NotFoundException('Blog not found');
    }

    // 204 No Content
    return;
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete blog by id' })
  async deleteBlog(@Param('id') id: string) {
    const deleted = await this.commandBus.execute(new DeleteBlogCommand(id));

    if (!deleted) {
      throw new NotFoundException('Blog not found');
    }

    // 204 No Content
    return;
  }
}
