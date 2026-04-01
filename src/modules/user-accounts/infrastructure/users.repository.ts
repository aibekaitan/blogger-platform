import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByLogin(login: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ login });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ email });
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    const trimmed = loginOrEmail.trim().toLowerCase();
    return await this.usersRepository
      .createQueryBuilder('u')
      .where('LOWER(u.login) = :val OR LOWER(u.email) = :val', { val: trimmed })
      .getOne();
  }

  async doesExistByLoginOrEmail(
    login: string,
    email: string,
  ): Promise<boolean> {
    const count = await this.usersRepository.count({
      where: [{ login }, { email }],
    });
    return count > 0;
  }

  async findUserByConfirmationCode(code: string): Promise<User | null> {
    return await this.usersRepository
      .createQueryBuilder('u')
      .where(`u."emailConfirmation"->>'confirmationCode' = :code`, { code })
      .getOne();
  }

  async findUserByPasswordRecoveryCode(code: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ passwordRecoveryCode: code });
  }

  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ id });
  }

  async create(user: User): Promise<string> {
    const savedUser = await this.usersRepository.save(user);
    return savedUser.id;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.usersRepository.delete(id);
    return result.affected === 1;
  }

  async updateRefreshToken(
    userId: string,
    token: string | null,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      refreshToken: token ?? null,
    });
  }

  async confirmEmail(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (user) {
      user.emailConfirmation.isConfirmed = true;
      await this.usersRepository.save(user);
    }
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await this.usersRepository.update(userId, {
      passwordHash: newPasswordHash,
    });
  }

  async updatePasswordRecoveryCode(
    userId: string,
    newCode: string,
  ): Promise<void> {
    await this.usersRepository.update(userId, {
      passwordRecoveryCode: newCode,
    });
  }

  async updateConfirmationCode(userId: string, newCode: string): Promise<void> {
    const user = await this.findById(userId);
    if (user) {
      const newExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);
      user.emailConfirmation.confirmationCode = newCode;
      user.emailConfirmation.expirationDate = newExpiration;
      await this.usersRepository.save(user);
    }
  }
}
