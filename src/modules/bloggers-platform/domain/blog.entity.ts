import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';

/**
 * Blog Entity
 * Представляет блог в системе
 */
@Schema({
  versionKey: false, // отключаем __v
  timestamps: { createdAt: true, updatedAt: false }, // только createdAt, updatedAt не нужен
  // timestamps: true,         // если хочешь и createdAt и updatedAt
})
export class Blog {
  _id: Types.ObjectId;
  /**
   * Строковый ID блога (часто используют uuid или custom string id)
   */
  @Prop({ type: String, required: true, unique: true })
  id: string;

  /**
   * Название блога
   */
  @Prop({ type: String, required: true, trim: true })
  name: string;

  /**
   * Описание блога
   */
  @Prop({ type: String, required: true, trim: true })
  description: string;

  /**
   * URL сайта блога
   */
  @Prop({ type: String, required: true })
  websiteUrl: string;

  /**
   * Дата создания (строка в ISO формате, как в твоей старой модели)
   * Если хочешь Date — можно заменить на Date
   */
  @Prop({ type: String, required: true })
  createdAt: string;

  /**
   * Флаг участия в программе лояльности / членства
   */
  @Prop({ type: Boolean, default: false })
  isMembership: boolean;

  // -------------------------------------------------------------------------
  // Виртуальное свойство id (если где-то нужен _id как строка)
  // -------------------------------------------------------------------------
  get stringId(): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this._id?.toString();
  }

  // -------------------------------------------------------------------------
  // Пример фабричного метода (DDD-style)
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Пример метода обновления (инкапсуляция)
  // -------------------------------------------------------------------------
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

// Подключаем методы класса к схеме (чтобы статические методы работали)
BlogSchema.loadClass(Blog);

// Типы для удобства
export type BlogDocument = HydratedDocument<Blog>;

// Если нужны статические методы на уровне модели:
export type BlogModelType = Model<BlogDocument> & typeof Blog;
