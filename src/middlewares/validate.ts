import { NextFunction, Response, Request } from "express";
import { AppError } from "../lib/utils/app-error";
import Joi from "joi";

export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return next(
        new AppError(
          error.details.map((err: any) => err.message).join(", "),
          400
        )
      );
    }
    next();
  };
};
