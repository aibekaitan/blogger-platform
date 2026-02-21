// import { body } from 'express-validator';
// import { usersRepository } from '../../../composition-root';
//
// export const emailValidation = body('email')
//   .isString()
//   .trim()
//   .isLength({ min: 1 })
//   .isEmail()
//   .withMessage('email is not correct')
//   .custom(async (email: string) => {
//     const user = await usersRepository.findByLoginOrEmail(email);
//     if (user) {
//       throw new Error('email already exist');
//     }
//     return true;
//   });
// src/users/api/dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, Validate } from 'class-validator';
import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { UsersRepository } from '../../infrastructure/users.repository';


@ValidatorConstraint({ async: true })
@Injectable()
export class IsEmailUnique implements ValidatorConstraintInterface {
  constructor(private readonly usersRepository: UsersRepository) {}

  async validate(email: string, args: ValidationArguments) {
    const user = await this.usersRepository.findByLoginOrEmail(email);
    return !user;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Email already exists';
  }
}



