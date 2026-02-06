export type SortQueryFilterType = {
  pageNumber: number;
  pageSize: number;
  sortDirection: 1 | -1;
  sortBy: string;
  searchLoginTerm?: string;
  searchEmailTerm?: string;
};
