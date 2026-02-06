import { ResultStatus } from './resultCode';
import { HttpStatuses } from '../types/httpStatuses';

export const resultCodeToHttpException = (resultCode: ResultStatus): number => {
  switch (resultCode) {
    case ResultStatus.Success:
      return HttpStatuses.Success; // 200
    case ResultStatus.BadRequest:
      return HttpStatuses.BadRequest; // 400
    case ResultStatus.Unauthorized: // ← ДОБАВЬТЕ ЭТО!
      return HttpStatuses.Unauthorized; // 401
    case ResultStatus.Forbidden:
      return HttpStatuses.Forbidden; // 403
    case ResultStatus.NotFound: // ← ДОБАВЬТЕ ЭТО!
      return HttpStatuses.NotFound; // 404
    default:
      return HttpStatuses.ServerError; // 500
  }
};
