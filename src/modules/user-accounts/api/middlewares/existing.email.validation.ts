// import { body } from 'express-validator';
//
// export const existingEmailValidation = body('email')
//   .isString()
//   .trim()
//   .isLength({ min: 1 })
//   .isEmail()
//   .withMessage('email is not correct');

// src/users/api/dto/email.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailDto {
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsEmail({}, { message: 'Email is not correct' })
  email: string;
}
