import { SortQueryFieldsType } from '../../../common/types/sortQueryFields.type';

export type CommentsQueryFieldsType = {
  searchLoginTerm?: string;
  searchEmailTerm?: string;
} & SortQueryFieldsType;
