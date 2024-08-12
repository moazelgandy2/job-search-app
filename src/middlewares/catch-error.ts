import { NextFunction, Request, Response } from "express";

export const catchError = (
  callback: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    callback(req, res, next).catch((err: any) => next(err));
  };
};
