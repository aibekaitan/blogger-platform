import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class NewPasswordInputDto {
  @IsString()
  @IsNotEmpty({ message: 'newPassword is required' })
  @MinLength(6, { message: 'newPassword must be at least 6 characters' })
  @MaxLength(20, { message: 'newPassword must be at most 20 characters' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'recoveryCode is required' })
  recoveryCode: string;
}