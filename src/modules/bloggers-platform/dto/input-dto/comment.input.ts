// dto/comment.input.ts
import {
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CommentInputModel {
  @IsString()
  @MinLength(20, { message: 'Comment content must be at least 20 characters' })
  @MaxLength(300)
  content: string;
}
