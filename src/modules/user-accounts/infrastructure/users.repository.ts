import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../domain/user.entity';
// import { User } from '../domain/user.entity'; // ← оставляем entity для типизации (опционально)

@Injectable()
export class UsersRepository {
  constructor(private dataSource: DataSource) {}

  // Пример: найти по login
  async findByLogin(login: string): Promise<User | null> {
    const [rows] = await this.dataSource.query(
      `SELECT * FROM users WHERE login = $1 LIMIT 1`,
      [login],
    );

    if (!rows?.length) return null;
    return rows[0] as User; // или маппинг, если нужно переименовать поля
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await this.dataSource.query(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    return rows?.[0] ?? null;
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    const [rows] = await this.dataSource.query(
      `
        SELECT *
        FROM users
        WHERE LOWER(login) = LOWER($1)
           OR LOWER(email) = LOWER($1)
          LIMIT 1
      `,
      [loginOrEmail.trim()],
    );
    return rows?.[0] ?? null;
  }

  async doesExistByLoginOrEmail(
    login: string,
    email: string,
  ): Promise<boolean> {
    const [rows] = await this.dataSource.query(
      `SELECT 1 FROM users 
       WHERE login = $1 OR email = $2 
       LIMIT 1`,
      [login, email],
    );
    return !!rows?.length;
  }

  async create(userData: {
    login: string;
    email: string;
    passwordHash: string;
  }): Promise<string> {
    const emailConfirmation = {
      confirmationCode: crypto.randomUUID(),
      expirationDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      isConfirmed: false,
    };

    const rows = await this.dataSource.query(
      `INSERT INTO users
    (login, email, "passwordHash", "createdAt", "emailConfirmation", "passwordRecoveryCode")
   VALUES ($1, $2, $3, NOW(), $4::jsonb, $5)
   RETURNING id`,
      [
        userData.login.trim(),
        userData.email.trim().toLowerCase(),
        userData.passwordHash,
        JSON.stringify(emailConfirmation),
        crypto.randomUUID(),
      ],
    );

    return rows[0].id;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `DELETE FROM users WHERE id = $1`,
      [id],
    );
    return result[1] === 1; // rowCount
  }

  async findById(id: string): Promise<User | null> {
    const [rows] = await this.dataSource.query(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    return rows?.[0] ?? null;
  }

  async updateRefreshToken(
    userId: string,
    token: string | null,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE users SET "refreshToken" = $1 WHERE id = $2`,
      [token, userId],
    );
  }

  async confirmEmail(userId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE users 
       SET "emailConfirmation" = jsonb_set("emailConfirmation", '{isConfirmed}', 'true'::jsonb)
       WHERE id = $1`,
      [userId],
    );
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE users SET "passwordHash" = $1 WHERE id = $2`,
      [newPasswordHash, userId],
    );
  }

  async updatePasswordRecoveryCode(
    userId: string,
    newCode: string,
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE users SET "passwordRecoveryCode" = $1 WHERE id = $2`,
      [newCode, userId],
    );
  }

  async updateConfirmationCode(userId: string, newCode: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE users 
       SET "emailConfirmation" = jsonb_set("emailConfirmation", '{confirmationCode}', $1::jsonb)
       WHERE id = $2`,
      [newCode, userId],
    );
  }

  async findUserByConfirmationCode(code: string): Promise<User | null> {
    const [rows] = await this.dataSource.query(
      `SELECT * FROM users 
       WHERE "emailConfirmation"->>'confirmationCode' = $1 
       LIMIT 1`,
      [code],
    );
    return rows?.[0] ?? null;
  }

  async findUserByPasswordRecoveryCode(code: string): Promise<User | null> {
    const [rows] = await this.dataSource.query(
      `SELECT * FROM users WHERE "passwordRecoveryCode" = $1 LIMIT 1`,
      [code],
    );
    return rows?.[0] ?? null;
  }
}
