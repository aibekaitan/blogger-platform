import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Blog, BlogDocument } from '../domain/blog.entity';
import type { BlogModelType } from '../domain/blog.entity';
import { Post, PostDocument } from '../domain/post.entity';
import type { PostModelType } from '../domain/post.entity';
import { PostInputModel } from '../dto/input-dto/post.input';
import { v4 as uuidv4 } from 'uuid';
import { mapBlogToView } from '../api/middlewares/blog.mapper';
import { Like, LikeDocument, LikeStatus } from '../domain/like.entity';
import { mapPostToView } from '../api/middlewares/posts.mapper';
import { CreatePostForBlogInputModel } from '../dto/input-dto/create-post-for-blog.input';
import { Model } from 'mongoose';
@Injectable()
export class BlogsRepository {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    @InjectModel(Post.name) private PostModel: PostModelType,
    @InjectModel(Like.name)
    private readonly likeModel: Model<LikeDocument>,
  ) {}

  async findById(id: string): Promise<BlogDocument | null> {
    console.log(id);
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
      items: items.map(mapBlogToView),
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
    currentUserId?: string | null, // ← add this parameter
  ) {
    const blogExists = await this.findById(blogId);
    if (!blogExists) return null;

    const direction = params.sortDirection === 'asc' ? 1 : -1;

    const filter = { blogId };

    const totalCount = await this.PostModel.countDocuments(filter);

    const dbItems = await this.PostModel.find(filter) // ← renamed to dbItems for clarity
      .sort({ [params.sortBy]: direction })
      .skip((params.pageNumber - 1) * params.pageSize)
      .limit(params.pageSize)
      .lean(); // ← .lean() is good here (same as in findAll)

    // ──────────────────────────────────────────────────────────────
    // Copy-paste/adapt the user likes logic from findAll
    const userLikesMap = new Map<string, LikeStatus>();

    if (currentUserId) {
      const userLikes = await this.likeModel
        .find({
          parentType: 'Post',
          authorId: currentUserId, // ← assuming your field is authorId
        })
        .select('parentId status')
        .lean();

      userLikes.forEach((like) => {
        userLikesMap.set(like.parentId.toString(), like.status as LikeStatus);
      });
    }
    // ──────────────────────────────────────────────────────────────

    const items = dbItems.map((post) => {
      const extended = post.extendedLikesInfo ?? {
        likesCount: 0,
        dislikesCount: 0,
        newestLikes: [],
      };

      return {
        ...post,
        extendedLikesInfo: {
          likesCount: extended.likesCount,
          dislikesCount: extended.dislikesCount,
          myStatus: userLikesMap.get(post._id.toString()) ?? LikeStatus.None, // ← important: .toString()
          newestLikes: [...extended.newestLikes],
        },
      };
    });

    return {
      pagesCount: Math.ceil(totalCount / params.pageSize),
      page: params.pageNumber,
      pageSize: params.pageSize,
      totalCount,
      items: items.map(mapPostToView),
    };
  }

  async createPostByBlogId(
    blog: BlogDocument,
    dto: CreatePostForBlogInputModel,
  ): Promise<PostDocument> {
    const post = new this.PostModel({
      id: uuidv4(),
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: blog.id,
      blogName: blog.name,
      createdAt: new Date().toISOString(),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatus.None,
        newestLikes: [],
      },
    });

    return post.save();
  }
}
