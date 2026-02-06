import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';

@Schema({
  versionKey: false, // __v disabled
  timestamps: { createdAt: true, updatedAt: false },
})
export class Blog {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  id: string;

  @Prop({ type: String, required: true, trim: true })
  name: string;

  @Prop({ type: String, required: true, trim: true })
  description: string;

  @Prop({ type: String, required: true })
  websiteUrl: string;

  @Prop({ type: String, required: true })
  createdAt: string;

  @Prop({ type: Boolean, default: false })
  isMembership: boolean;

  get stringId(): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this._id?.toString();
  }

  static create(dto: {
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
  }): Blog {
    const blog = new this();
    blog.id = dto.id;
    blog.name = dto.name.trim();
    blog.description = dto.description.trim();
    blog.websiteUrl = dto.websiteUrl;
    blog.createdAt = new Date().toISOString();
    blog.isMembership = false;
    return blog;
  }

  updateNameAndDescription(newName: string, newDescription: string): void {
    if (newName?.trim()) {
      this.name = newName.trim();
    }
    if (newDescription?.trim()) {
      this.description = newDescription.trim();
    }
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.loadClass(Blog);

export type BlogDocument = HydratedDocument<Blog>;

export type BlogModelType = Model<BlogDocument> & typeof Blog;
