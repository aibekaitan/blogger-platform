import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SortQueryFilterType } from '../../../../common/types/sortQueryFilter.type';
import { IPagination } from '../../../../common/types/pagination';
import { IUserView, IUserView2 } from '../../types/user.view.interface';

@Injectable()
export class UsersQueryRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findAllUsers(
    sortQueryDto: SortQueryFilterType,
  ): Promise<IPagination<IUserView[]>> {
    const {
      searchEmailTerm = '',
      searchLoginTerm = '',
      sortBy = 'createdAt',
      sortDirection = 'desc', // теперь строка 'asc' | 'desc' (не -1/1)
      pageSize = 10,
      pageNumber = 1,
    } = sortQueryDto;

    // Нормализуем sortDirection
    const direction =
      sortDirection === -1 || sortDirection === 'desc' ? 'DESC' : 'ASC';

    // Безопасные поля для сортировки (защита от инъекций)
    const allowedSortFields = ['login', 'email', 'createdAt'];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    // Базовый WHERE
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (searchLoginTerm) {
      whereClause += ` AND login ILIKE $${paramIndex}`;
      params.push(`%${searchLoginTerm}%`);
      paramIndex++;
    }

    if (searchEmailTerm) {
      whereClause += ` AND email ILIKE $${paramIndex}`;
      params.push(`%${searchEmailTerm}%`);
      paramIndex++;
    }

    // Убираем первый "AND" если есть
    if (whereClause.startsWith(' AND')) {
      whereClause = 'WHERE' + whereClause.substring(4);
    }

    // 1. Получаем общее количество (аналог countDocuments)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;

    const countResult = await this.dataSource.query(countQuery, params);
    const totalCount = Number(countResult[0]?.total ?? 0);

    // 2. Получаем данные с пагинацией и сортировкой
    const dataQuery = `
      SELECT 
        id,
        login,
        email,
        createdAt
      FROM users
      ${whereClause}
      ORDER BY "${safeSortBy}" ${direction}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Добавляем параметры для LIMIT / OFFSET
    const dataParams = [...params, pageSize, (pageNumber - 1) * pageSize];

    const usersRaw = await this.dataSource.query(dataQuery, dataParams);

    const items = usersRaw.map((row: any) => this._toUserView(row));

    return {
      pagesCount: totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0,
      page: pageNumber,
      pageSize,
      totalCount,
      items,
    };
  }

  async getByIdOrNotFoundFail(id: string): Promise<IUserView> {
    // Простая проверка UUID (если id — uuid)
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new Error('Invalid user ID');
    }

    const query = `
      SELECT 
        id,
        login,
        email,
        createdAt
      FROM users
      WHERE id = $1
      LIMIT 1
    `;

    const [user] = await this.dataSource.query(query, [id]);

    if (!user) {
      throw new Error('User not found');
    }

    return this._toUserView(user);
  }

  private _toUserView(row: any): IUserView {
    return {
      id: row.id, // уже строка (uuid)
      login: row.login,
      email: row.email,
      createdAt: new Date(row.createdat).toISOString(), // PostgreSQL возвращает Date или строку
    };
  }

  private _toUserView2(row: any): IUserView2 {
    return {
      userId: row.id,
      login: row.login,
      email: row.email,
    };
  }

  // Если нужно — можно оставить, но в PostgreSQL обычно не нужно проверять ObjectId
  private _checkId(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    );
  }
}
