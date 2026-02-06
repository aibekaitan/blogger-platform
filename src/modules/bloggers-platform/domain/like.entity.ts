import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

@Schema({
  versionKey: false,
  timestamps: false,
})
export class Like {
  _id: Types.ObjectId;
  @Prop({ type: Date, required: true, default: Date.now })
  createdAt: Date;

  @Prop({
    type: String,
    enum: Object.values(LikeStatus),
    required: true,
  })
  status: LikeStatus;

  @Prop({ type: String, required: true })
  authorId: string;

  @Prop({ type: String, required: true })
  parentId: string;

  @Prop({ type: String, default: 'Comment' })
  parentType: string;


  get id(): string {
    return this._id?.toString();
  }

  static create(dto: {
    authorId: string;
    parentId: string;
    status: LikeStatus;
    parentType?: string;
  }): Like {
    const like = new this();
    like.authorId = dto.authorId;
    like.parentId = dto.parentId;
    like.status = dto.status;
    like.parentType = dto.parentType || 'Comment';
    like.createdAt = new Date();
    return like;
  }
}

export const LikeSchema = SchemaFactory.createForClass(Like);
LikeSchema.loadClass(Like);

LikeSchema.index({ authorId: 1, parentId: 1, parentType: 1 }, { unique: true });

export type LikeDocument = HydratedDocument<Like>;
