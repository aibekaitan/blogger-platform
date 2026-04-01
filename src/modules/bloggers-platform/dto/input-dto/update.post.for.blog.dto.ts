import { IsNotEmpty, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePostForBlogDto {
  @Transform(({ value }) => (value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @Length(1, 30)
  title: string;

  @Transform(({ value }) => (value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  shortDescription: string;

  @Transform(({ value }) => (value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  content: string;
}
