import { Post } from '../domain/post.entity';

export type PostPaginator = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: Post[]; //generic
};
