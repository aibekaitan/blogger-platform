// // src/users/api/dto/create-user.dto.ts
// import {
//   IsString,
//   IsNotEmpty,
//   Length,
//   Validate,
//   IsEmail,
// } from 'class-validator';
// import { Injectable } from '@nestjs/common';
// import {
//   ValidatorConstraint,
//   ValidatorConstraintInterface,
//   ValidationArguments,
// } from 'class-validator';
// import { UsersRepository } from '../../infrastructure/users.repository';
// // путь к твоему репозиторию
//
// // --- кастомный валидатор для уникального логина ---
// @ValidatorConstraint({ async: true })
// @Injectable()
// export class IsLoginUnique implements ValidatorConstraintInterface {
//   constructor(private readonly usersRepository: UsersRepository) {}
//
//   async validate(login: string, args: ValidationArguments) {
//     const user = await this.usersRepository.findByLoginOrEmail(login);
//     return !user; // true если логин свободен
//   }
//
//   defaultMessage(args: ValidationArguments) {
//     return 'Login already exists';
//   }
// }
//
// // --- DTO для регистрации или создания пользователя ---
// export class CreateUserDto {
//   @IsString()
//   @IsNotEmpty({ message: 'Login should not be empty' })
//   @Length(3, 10, { message: 'Login must be between 3 and 10 characters' })
//   @Validate(IsLoginUnique)
//   login: string;
//
//   @IsString()
//   @IsNotEmpty({ message: 'Email should not be empty' })
//   @Length(1, 500)
//   @IsEmail({}, { message: 'Email is not correct' })
//   email: string;
//
//   @IsString()
//   @IsNotEmpty({ message: 'Password should not be empty' })
//   @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
//   password: string;
//
//   @IsString()
//   @IsNotEmpty({ message: 'New password should not be empty' })
//   @Length(6, 20, {
//     message: 'New password must be between 6 and 20 characters',
//   })
//   newPassword: string;
// }
