import { IsEmail, IsNotEmpty } from 'class-validator';

export class PasswordRecoveryInputDto {
  @IsEmail({}, { message: 'invalid email format' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;
}