// src/bloggers-platform/dto/post.input.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString, Length } from 'class-validator';

export class PostInputModel {
  @ApiProperty({ example: 'New Post Title', minLength: 3, maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  title: string;

  @ApiProperty({
    example: 'Short description...',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  shortDescription: string;

  @ApiProperty({
    example: 'Full content of the post...',
    minLength: 3,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 1000)
  content: string;


  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId({ message: 'Invalid blogId format' })
  blogId: string;
}
