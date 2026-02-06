// src/common/dto/base-query-params.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SortDirection } from '../types/sort'; // или откуда у тебя enum

export class BaseQueryParams {
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageNumber must be integer' })
  @Min(1, { message: 'pageNumber must be at least 1' })
  pageNumber = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize must be integer' })
  @Min(1, { message: 'pageSize must be at least 1' })
  @Max(100, { message: 'pageSize cannot exceed 100' })
  pageSize = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: SortDirection,
    example: SortDirection.Desc,
    default: SortDirection.Desc,
  })
  @IsOptional()
  @IsEnum(SortDirection, {
    message: `sortDirection must be one of: ${Object.values(SortDirection).join(', ')}`,
  })
  sortDirection = SortDirection.Desc;

  /**
   * Удобный метод для skip в MongoDB (.skip())
   */
  calculateSkip(): number {
    return (this.pageNumber - 1) * this.pageSize;
  }

  /**
   * Удобный метод для sort-объекта в MongoDB
   */
  getSortObject(): Record<string, 1 | -1> {
    const direction = this.sortDirection === SortDirection.Asc ? 1 : -1;
    return { [this.sortBy]: direction };
  }
}