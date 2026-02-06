// import { NextFunction, Request, Response } from 'express';
// import { validationResult, ValidationError } from 'express-validator';
//
// export const inputValidation = (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   const errorFormatter = (error: ValidationError) => {
//     const err = error as any;
//     return {
//       message: err.msg,
//       field: err.path,
//     };
//   };
//
//   const result = validationResult(req).formatWith(errorFormatter);
//
//   if (!result.isEmpty()) {
//     res.status(400).send({
//       errorsMessages: result.array({ onlyFirstError: true }),
//     });
//     return;
//   }
//
//   next();
// };
