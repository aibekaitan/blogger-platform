// src/common/dto/pagination-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SortDirection } from '../../../../core/types/sort';

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageNumber must be integer' })
  @Min(1)
  pageNumber = 1;

  @ApiPropertyOptional({ default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;

  @ApiPropertyOptional({ default: 'createdAt', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy = 'createdAt';

  @ApiPropertyOptional({ default: SortDirection.Desc, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection = SortDirection.Desc;
}