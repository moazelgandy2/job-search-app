import { NextFunction, Request, Response } from "express";
import { UserModel } from "../../db/models/user-model";
import { AppError } from "./utils/app-error";

export const CheckEmailValidity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.originalUrl == "/update" && !req.body.email) {
      return next();
    }
    const user = await UserModel.findOne({
      email: req.body.email,
    });

    if (user) {
      return res
        .status(409)
        .json({ message: "User with this email already exist" });
    } else {
      next();
    }
  } catch (error: any) {
    next(new AppError(error, 500));
  }
};
