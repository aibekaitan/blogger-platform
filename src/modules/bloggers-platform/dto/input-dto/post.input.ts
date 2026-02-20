// src/bloggers-platform/dto/post.input.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class PostInputModel {
  @Transform(({ value }) => (value ?? '').trim())
  @ApiProperty({ example: 'New Post Title', minLength: 3, maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @Length(3, 30)
  title: string;
  @Transform(({ value }) => (value ?? '').trim())
  @ApiProperty({
    example: 'Short description...',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  shortDescription: string;

  @Transform(({ value }) => (value ?? '').trim())
  @ApiProperty({
    example: 'Full content of the post...',
    minLength: 3,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 1000)
  content: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID блога, к которому относится пост',
  })
  @IsNotEmpty({ message: 'blogId is required' })
  @IsString()
  blogId: string;
  // @IsMongoId({ message: 'Invalid blogId format' })
}
