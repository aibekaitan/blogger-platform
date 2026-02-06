import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export interface ICommentatorInfo {
  userId: string;
  userLogin: string;
}

@Schema({
  versionKey: false,
  timestamps: { createdAt: true, updatedAt: false },
})
export class Comment {
  _id: Types.ObjectId;
  @Prop({ type: String, required: true, unique: true })
  id: string;

  @Prop({ type: String, required: true })
  postId: string;

  @Prop({ type: String, required: true, trim: true })
  content: string;

  @Prop({
    type: {
      userId: { type: String, required: true },
      userLogin: { type: String, required: true },
    },
    required: true,
    _id: false,
  })
  commentatorInfo: ICommentatorInfo;

  // createdAt будет автоматически (Date), если используем timestamps
  // если нужен string ISO — оставляем вручную
  @Prop({ type: String, required: true })
  createdAt: string;

  // виртуальное поле
  get stringId(): string {
    return this._id?.toString();
  }

  static create(dto: {
    id: string;
    postId: string;
    content: string;
    commentatorInfo: ICommentatorInfo;
  }): Comment {
    const comment = new this();
    comment.id = dto.id;
    comment.postId = dto.postId;
    comment.content = dto.content.trim();
    comment.commentatorInfo = dto.commentatorInfo;
    comment.createdAt = new Date().toISOString();
    return comment;
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;