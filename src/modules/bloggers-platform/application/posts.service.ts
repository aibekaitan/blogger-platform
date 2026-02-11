import { Injectable, NotFoundException } from '@nestjs/common';
// import { PostRepository } from '../repositories/posts-repository';
// import { PostQueryRepository } from '../repositories/post.query.repository';
// import { PostInputModel } from '../dto/post.input';
// import { CommentInputModel, CommentViewModel } from '../../comments/types/comments.dto';
// import { IPagination } from '../../common/types/pagination';
import { CommentsQueryFieldsType } from '../types/comments.queryFields.type';
import { PostRepository } from '../infrastructure/posts.repository';
import { PostQueryRepository } from '../infrastructure/query-repo/posts.query.repository';
import { SortQueryFilterType } from '../../../common/types/sortQueryFilter.type';
import { IPagination } from '../../../common/types/pagination';
import { sortQueryFieldsUtil } from '../../../common/utils/sortQueryFields.util';
// import { PostInputModel } from '../dto/input-dto/post.input';
import { CommentInputModel, CommentViewModel } from '../dto/comments.dto';
import { PostInputModelType } from '../types/post.input.type';
import { CommentRepository } from '../infrastructure/comments.repository';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { SortQueryFieldsType } from '../../../common/types/sortQueryFields.type';
import { PostInputModel } from '../dto/input-dto/post.input';
import { mapPostToView } from '../api/middlewares/posts.mapper';
// import { PostViewModel } from '../types/posts.dto';
// import { SortQueryFilterType } from '../../common/types/sortQueryFilter.type';
// import { sortQueryFieldsUtil } from '../../common/utils/sortQueryFields.util';

@Injectable()
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly postQueryRepository: PostQueryRepository,
    private readonly blogRepository: BlogsRepository,
  ) {}

  async getAllPosts(query: any, currentUserId?: string) {
    const pageNumber = Number(query.pageNumber) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortDirection = query.sortDirection === 'asc' ? 'asc' : 'desc';

    return this.postRepository.findAll(
      { pageNumber, pageSize, sortBy, sortDirection },
      currentUserId,
    );
  }

  async getPostById(postId: string, currentUserId?: string) {
    const post = await this.postRepository.findById(postId, currentUserId);
    if (!post) return null;
    return mapPostToView(post);
  }

  async createPost(dto: PostInputModel) {
    const blog = await this.blogRepository.findById(dto.blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    const post = mapPostToView(
      await this.postRepository.create(dto, blog.name),
    );

    return post;
  }

  async getCommentsByPostId(
    postId: string,
    query: CommentsQueryFieldsType,
    currentUserId?: string,
  ): Promise<IPagination<CommentViewModel[]>> {
    const { pageNumber, pageSize, sortBy, sortDirection } =
      sortQueryFieldsUtil(query);

    return this.postQueryRepository.findAllCommentsByPostId(
      postId,
      {
        searchLoginTerm: query.searchLoginTerm,
        searchEmailTerm: query.searchEmailTerm,
        pageNumber,
        pageSize,
        sortBy,
        sortDirection,
      },
      currentUserId,
    );
  }

  async createComment(
    postId: string,
    dto: CommentInputModel,
    currentUserId?: string,
  ): Promise<CommentViewModel> {
    const createdComment = await this.postRepository.createComment(
      dto,
      postId,
      currentUserId!,
    );
    return this.postQueryRepository._getInViewComment(
      createdComment,
      currentUserId,
    );
  }
  async updatePost(postId: string, dto: PostInputModel): Promise<boolean> {
    const blog = await this.blogRepository.findById(dto.blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const updateResult = await this.postRepository.update(postId, dto);

    return updateResult.matchedCount === 1;
  }

  async deletePost(postId: string): Promise<boolean> {
    const deleteResult = await this.postRepository.delete(postId);
    return deleteResult.deletedCount === 1;
  }
}
