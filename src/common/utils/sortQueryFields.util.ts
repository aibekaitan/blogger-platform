import { SortQueryFieldsType } from '../types/sortQueryFields.type';
import { SortQueryFilterType } from '../types/sortQueryFilter.type';

export const sortQueryFieldsUtil = (
  query: SortQueryFieldsType,
): SortQueryFilterType => {
  const pageNumber = !isNaN(Number(query.pageNumber))
    ? Number(query.pageNumber)
    : 1;
  const pageSize = !isNaN(Number(query.pageSize)) ? Number(query.pageSize) : 10;
  const sortBy = query.sortBy ? query.sortBy : 'createdAt';
  const sortDirection: 1 | -1 = query.sortDirection === 'asc' ? 1 : -1;
  const result = {
    pageNumber,
    pageSize,
    sortDirection,
    sortBy,
    searchLoginTerm: query.searchLoginTerm,
    searchEmailTerm: query.searchEmailTerm,
  };
  return result;
};
