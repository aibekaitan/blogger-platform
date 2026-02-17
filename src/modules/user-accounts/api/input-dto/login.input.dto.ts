import { IsNotEmpty, IsString } from 'class-validator';

export class LoginInputDto {
  @IsString()
  @IsNotEmpty({ message: 'loginOrEmail is required' })
  loginOrEmail: string;

  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  password: string;
}