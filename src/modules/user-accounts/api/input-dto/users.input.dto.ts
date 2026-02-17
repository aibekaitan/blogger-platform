import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserInputDto {
  @IsString()
  @IsNotEmpty({ message: 'login is required' })
  @MinLength(3, { message: 'login must be at least 3 characters' })
  @MaxLength(10, { message: 'login must be at most 10 characters' })
  @Matches(/^[a-zA-Z0-9_-]*$/, {
    message: 'login can contain only letters, numbers, underscores and hyphens',
  })
  login: string;

  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(6, { message: 'password must be at least 6 characters' })
  @MaxLength(20, { message: 'password must be at most 20 characters' })
  password: string;

  @IsEmail({}, { message: 'invalid email format' })
  @IsNotEmpty({ message: 'email is required' })
  @Matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, {
    message: 'invalid email format',
  })
  email: string;
}
