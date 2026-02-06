// src/bloggers-platform/dto/blog.input.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, Length, Matches } from 'class-validator';

export class BlogInputModel {
  @ApiProperty({ example: 'My Blog', minLength: 3, maxLength: 15 })
  @IsString()
  @IsNotEmpty()
  @Length(3, 15, { message: 'Name must be between 3 and 15 characters' })
  name: string;

  @ApiProperty({
    example: 'Description of my blog',
    minLength: 3,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 500, {
    message: 'Description must be between 3 and 500 characters',
  })
  description: string;

  @ApiProperty({ example: 'https://my-blog.com' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'Invalid website URL format' })
  @Matches(/^https:\/\//, {
    message: 'Website URL must start with https://',
  })
  @Length(10, 100)
  websiteUrl: string;
}
