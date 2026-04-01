import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PostQueryRepository {
  constructor(private readonly dataSource: DataSource) {}

  // Other post-related query methods can stay here
}
