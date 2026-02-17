import { IsNotEmpty, IsString } from 'class-validator';

export class RegistrationConfirmationInputDto {
  @IsString()
  @IsNotEmpty({ message: 'code is required' })
  code: string;
}