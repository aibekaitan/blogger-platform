import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Blog,
  BlogDocument,
} from '../../modules/bloggers-platform/domain/blog.entity';
import {
  Post,
  PostDocument,
} from '../../modules/bloggers-platform/domain/post.entity';
import {
  Comment,
  CommentDocument,
} from '../../modules/bloggers-platform/domain/comment.entity';
import {
  User,
  UserDocument,
} from '../../modules/user-accounts/domain/user.entity';
// ... остальные сущности (Like, RequestLog и т.д.)

@Injectable()
export class TestingService {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    // ... добавь все остальные модели, которые нужно чистить
    // @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    // @InjectModel(RequestLog.name) private requestLogModel: Model<RequestLogDocument>,
  ) {}

  async deleteAllData(): Promise<void> {
    await Promise.all([
      this.blogModel.deleteMany({}).exec(),
      this.postModel.deleteMany({}).exec(),
      this.commentModel.deleteMany({}).exec(),
      this.userModel.deleteMany({}).exec(),
      // this.likeModel.deleteMany({}).exec(),
      // this.requestLogModel.deleteMany({}).exec(),
      // ... все остальные
    ]);
  }
}
