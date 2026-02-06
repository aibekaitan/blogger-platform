import { ResultStatus } from './resultCode';

export type ExtensionType = {
  message: string;
  field?: string;
};

export type Result<T = null> = {
  status: ResultStatus;
  data?: T;
  errorMessage?: string;
  extensions?: ExtensionType[];
};
export interface ServiceResult<T = void> {
  status: ResultStatus;
  data?: T;
  extensions?: Array<{ message: string; field?: string }>;
}
