import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePostForBlogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
