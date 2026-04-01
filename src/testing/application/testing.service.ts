import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TestingService {
  constructor(private readonly dataSource: DataSource) {}

  async deleteAllData(): Promise<void> {
    // Для PostgreSQL / MySQL / SQLite
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Отключаем проверки внешних ключей (важно для CASCADE)
      await queryRunner.query('SET CONSTRAINTS ALL DEFERRED'); // PostgreSQL
      // или для MySQL: await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0;');

      // Список таблиц в правильном порядке (от зависимых → к независимым)
      const tables = [
        'comments', // зависит от posts и users
        'likes', // зависит от comments и users
        'posts', // зависит от blogs и users
        'blogs', // зависит от users
        'devices',
        'users', // независимая (или почти)
      ];

      for (const table of tables) {
        await queryRunner.query(`TRUNCATE TABLE "${table}" CASCADE;`);
      }

      // Включаем обратно (MySQL)
      // await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1;');

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('Ошибка очистки базы:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
