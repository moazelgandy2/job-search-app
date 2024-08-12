import { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/utils/app-error";
import jwt from "jsonwebtoken";
import { CompanyModel } from "../../db/models/company-model";
import mongoose from "mongoose";

export const checkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.headers as any;

    if (!token) {
      return next(new AppError("Unauthorized", 401));
    }

    const validToken = jwt.verify(token, "secret");

    if (!validToken) {
      return next(new AppError("Unauthorized", 401));
    }

    const decodedToken = jwt.decode(token);

    if (
      req.originalUrl == "/users/info/me" ||
      req.originalUrl == "/users/password" ||
      req.originalUrl == "/users/recovery-email-users" ||
      req.originalUrl.startsWith("/company") ||
      req.originalUrl.startsWith("/jobs") ||
      req.originalUrl.startsWith("/company/applications")
    ) {
      req.params.userId = (decodedToken as any).user._id;
    }

    if (
      (decodedToken as any).user._id != req.params.userId &&
      !req.originalUrl.startsWith("/users/info")
    ) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!decodedToken) {
      return next(new AppError("Unauthorized", 401));
    }

    (req as any).user = (decodedToken as any).user;
    next();
  } catch (error: any) {
    return next(new AppError("Error", 401));
  }
};

export const validateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const role = (req as any).user.role;
  if (role != "hr") {
    return next(new AppError(`Only HR can access this route`, 401));
  }

  if (req.originalUrl == "/company" && req.method == "POST") {
    return next();
  }

  if (req.originalUrl.startsWith("/company") && req.method == "DELETE") {
    const company = await CompanyModel.findOne({
      _id: (req as any).params.companyId,
    });

    return next();
  }
  if (!req.originalUrl.startsWith("/company")) {
    return next();
  }

  if (req.originalUrl.startsWith("/company/applications")) {
    const userCompany = await CompanyModel.findOne({
      hr: (req as any).user._id,
    });

    if (!userCompany) {
      return next(new AppError(`Unauthorized, users company not found.`, 401));
    }

    return next();
  }
  const company = await CompanyModel.findOne({
    _id: (req as any).params.companyId,
    hr: (req as any).user._id,
  });

  if (!company) {
    console.log("Company not found");
    return next(new AppError(`Unauthorized, users company not found.`, 401));
  }

  next();
};
