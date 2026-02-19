import { Injectable, NotFoundException } from '@nestjs/common';
import { PostRepository } from '../infrastructure/posts.repository';
import { PostQueryRepository } from '../infrastructure/query-repo/posts.query.repository';
import { BlogsRepository } from '../infrastructure/blogs.repository';
import { CommentRepository } from '../infrastructure/comments.repository';
import { PostInputModel } from '../dto/input-dto/post.input';
import { LikeStatusInputModel } from '../dto/input-dto/like-status.input';
import { CommentInputModel, CommentViewModel } from '../dto/comments.dto';
import { CommentsQueryFieldsType } from '../types/comments.queryFields.type';
import { IPagination } from '../../../common/types/pagination';
import { mapPostToView } from '../api/middlewares/posts.mapper';
import { sortQueryFieldsUtil } from '../../../common/utils/sortQueryFields.util';

@Injectable()
export class PostService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly postQueryRepository: PostQueryRepository,
    private readonly blogRepository: BlogsRepository,
    private readonly commentRepository: CommentRepository,
  ) {}

  // GET /posts — все посты с пагинацией
  async getAllPosts(query: any, currentUserId?: string | null) {
    const pageNumber = Number(query.pageNumber) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortDirection = query.sortDirection === 'asc' ? 'asc' : 'desc';

    return this.postRepository.findAll(
      { pageNumber, pageSize, sortBy, sortDirection },
      currentUserId,
    );
  }

  // GET /posts/:id — пост по id
  async getPostById(postId: string, currentUserId?: string | null) {
    const post = await this.postRepository.findById(postId, currentUserId);
    if (!post) return null;
    return mapPostToView(post);
  }

  // POST /posts — создание поста
  async createPost(dto: PostInputModel) {
    console.log(dto);
    const blog = await this.blogRepository.findById(dto.blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const createdPost = await this.postRepository.create(dto, blog.name);
    return mapPostToView(createdPost);
  }

  // PUT /posts/:id — обновление поста
  async updatePost(postId: string, dto: PostInputModel): Promise<boolean> {
    const blog = await this.blogRepository.findById(dto.blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const updateResult = await this.postRepository.update(postId, dto);

    return updateResult.matchedCount === 1;
  }

  // DELETE /posts/:id
  async deletePost(postId: string): Promise<boolean> {
    const deleteResult = await this.postRepository.delete(postId);
    return deleteResult.deletedCount === 1;
  }

  // GET /posts/:postId/comments
  async getCommentsByPostId(
    postId: string,
    query: CommentsQueryFieldsType,
    currentUserId?: string | null,
  ): Promise<IPagination<CommentViewModel[]>> {
    const postExists = await this.postRepository.findById(
      postId,
      currentUserId,
    );
    if (!postExists) {
      throw new NotFoundException('Post not found');
    }

    const { pageNumber, pageSize, sortBy, sortDirection } =
      sortQueryFieldsUtil(query);

    return this.postQueryRepository.findAllCommentsByPostId(
      postId,
      { pageNumber, pageSize, sortBy, sortDirection },
      currentUserId,
    );
  }

  // POST /posts/:postId/comments — создание комментария
  async createComment(
    postId: string,
    dto: CommentInputModel,
    userId: string,
  ): Promise<CommentViewModel> {
    // Проверяем существование поста
    const post = await this.postRepository.findById(postId, userId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Создаём комментарий через репозиторий
    const createdComment = await this.commentRepository.create(
      dto,
      postId,
      userId,
      // userLogin нужно передать!
      // Если его нет в currentUser — добавь в JwtStrategy или вытащи из usersService
      'temp-login', // ← временно, замени на реальный userLogin
    );

    // Возвращаем view-модель с myStatus
    return this.postQueryRepository._getInViewComment(createdComment, userId);
  }

  // PUT /posts/:postId/like-status
  async updateLikeStatus(
    postId: string,
    userId: string,
    likeStatus: LikeStatusInputModel['likeStatus'],
  ): Promise<boolean | void> {
    const post = await this.postRepository.findById(postId, userId);
    if (!post) {
      throw new NotFoundException({
        message: 'Post not found',
        field: 'postId',
      });
    }

    return this.postRepository.setLikeStatus(postId, userId, likeStatus);
  }
}
