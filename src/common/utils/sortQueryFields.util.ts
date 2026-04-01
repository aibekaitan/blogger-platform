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

  // 🔥 главное изменение
  const sortDirection: 'asc' | 'desc' =
    query.sortDirection === 'asc' ? 'asc' : 'desc';

  return {
    pageNumber,
    pageSize,
    sortDirection,
    sortBy,

    // 👇 оставь только если реально используешь
    searchLoginTerm: query.searchLoginTerm,
    searchEmailTerm: query.searchEmailTerm,
  };
};
