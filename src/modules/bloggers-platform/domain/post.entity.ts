import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { Blog, BlogDocument } from './blog.entity';
// import { LikeStatus } from './like.entity';

@Schema({
  versionKey: false,
  timestamps: false,
})
export class Post {
  _id: Types.ObjectId;
  @Prop({ type: String, required: true, unique: true })
  id: string;

  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true, trim: true })
  shortDescription: string;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, required: true })
  blogId: string;

  @Prop({ type: String, required: true })
  blogName: string;

  @Prop({ type: String, required: true })
  createdAt: string;

  @Prop({
    type: {
      likesCount: { type: Number, default: 0, min: 0 },
      dislikesCount: { type: Number, default: 0, min: 0 },
      newestLikes: {
        type: [
          {
            addedAt: { type: String, required: true },
            userId: { type: String, required: true },
            login: { type: String, required: true },
          },
        ],
        default: [],
      },
    },
    default: { likesCount: 0, dislikesCount: 0, newestLikes: [] },
    _id: false,
  })
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    newestLikes: Array<{ addedAt: string; userId: string; login: string }>;
  };

  // get stringId(): string {
  //   return this._id?.toString();
  // }

  static create(dto: {
    id: string;
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
  }): Post {
    const post = new this();
    post.id = dto.id;
    post.title = dto.title.trim();
    post.shortDescription = dto.shortDescription.trim();
    post.content = dto.content;
    post.blogId = dto.blogId;
    post.blogName = dto.blogName;
    post.createdAt = new Date().toISOString();
    post.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      newestLikes: [],
    };
    return post;
  }
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.loadClass(Post);

export type PostDocument = HydratedDocument<Post>;

export type PostModelType = Model<PostDocument> & typeof Post;
