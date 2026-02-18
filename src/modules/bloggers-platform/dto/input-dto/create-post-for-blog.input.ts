// src/bloggers-platform/dto/input-dto/create-post-for-blog.input.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreatePostForBlogInputModel {
  @ApiProperty({ example: 'New Post Title', minLength: 3, maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  title: string;

  @ApiProperty({ minLength: 3, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  shortDescription: string;

  @ApiProperty({ minLength: 3, maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @Length(3, 1000)
  content: string;
}