import { NextFunction, Request, Response } from "express";
import { AppError } from "../../lib/utils/app-error";
import { UserModel } from "../../../db/models/user-model";
import mongoose, { isValidObjectId } from "mongoose";
import { CompanyModel } from "../../../db/models/company-model";
import { ApplicationModel } from "../../../db/models/application-model";
import { generateCompanyApplicationsExcel } from "../../lib/generate-excel";
import { parseDate } from "../../lib/utils/parse-data";

export const addCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await UserModel.findById({
      _id: req.body.hr,
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const validEmail = await CompanyModel.findOne({})
      .where("email")
      .equals(req.body.email);

    if (validEmail) {
      return next(new AppError("Email already exists", 400));
    }

    const company = await CompanyModel.create({
      ...req.body,
      hr: new mongoose.Types.ObjectId(req.body.hr),
    });

    if (!company) return next(new AppError("Company not created", 400));

    if (user.role != "hr") {
      await user.updateOne({
        _id: req.body.hr,
        role: "hr",
      });
    }

    res.json({ message: "Company created", company });
  } catch (error: any) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};

export const updateCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;

    if (!isValidObjectId(companyId)) {
      return next(new AppError("Invalid company id", 400));
    }

    const company = await CompanyModel.findById(companyId);

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const validEmail = await CompanyModel.findOne({})
      .where("email")
      .equals(req.body.email);

    if (validEmail) {
      return next(new AppError("Email already exists", 400));
    }

    const updatedCompany = await CompanyModel.findByIdAndUpdate(
      companyId,
      req.body,
      { new: true }
    );

    if (!updatedCompany) {
      return next(new AppError("Company not updated", 400));
    }

    res.json({ message: "Company updated", company: updatedCompany });
  } catch (error: any) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};

export const deleteCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return next(new AppError("Company id is required", 400));
    }

    if (!isValidObjectId(companyId)) {
      return next(new AppError("Invalid company id", 400));
    }

    const company = await CompanyModel.findById(companyId);

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    await CompanyModel.findByIdAndDelete(companyId);

    res.json({ message: "Company deleted" });
  } catch (error: any) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};

export const getCompanyApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    const { jobId } = req.params;
    const hex24Regex = /^[a-fA-F0-9]{24}$/;
    const validJobId = hex24Regex.test(jobId);

    if (!validJobId) {
      return next(new AppError("Invalid job id", 400));
    }

    const userCompany = await CompanyModel.findOne({
      hr: user._id,
    });

    if (!userCompany) {
      return next(new AppError(`Unauthorized, users company not found.`, 401));
    }

    const companyApplications = await ApplicationModel.find({
      job: jobId,
    })
      .populate({ path: "job" })
      .populate({ path: "userId" })
      .lean();

    const jobDetails =
      companyApplications.length > 0 ? companyApplications[0].job : null;

    const usersInfo = companyApplications.map((application: any) => ({
      _id: application.userId._id,
      firstName: application.userId.firstName,
      lastName: application.userId.lastName,
      userName: application.userId.userName,
      email: application.userId.email,
      phoneNumber: application.userId.phoneNumber,
      role: application.userId.role,
      status: application.userId.status,
      userTechSkills: application.userTechSkills,
      userResume: application.userResume,
    }));
    const response = {
      job: jobDetails,
      usersInfo,
      jobId,
    };

    res.json({ response });
  } catch (error: any) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};

export const generateSheet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId, date } = req.query;

    if (!companyId || !date) {
      return next(new AppError("Company id and date are required", 400));
    }

    const dateStr = date as string;
    const parsedDate = await parseDate(dateStr);

    const hex24Regex = /^[a-fA-F0-9]{24}$/;
    const validJobId = hex24Regex.test(companyId as string);

    if (!validJobId) {
      return next(new AppError("Invalid company id", 400));
    }

    const company = await CompanyModel.findOne({
      _id: companyId,
    });

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const response = await generateCompanyApplicationsExcel(
      companyId,
      parsedDate
    );

    if (!response) return;

    if (response.error) {
      return next(new AppError(`Error `, 400));
    }

    if (response.empty) {
      return next(new AppError(response.empty, 404));
    }

    res.json({ message: "Excel generated", url: response?.url });
  } catch (error: any) {
    console.log(error);

    return next(new AppError(`Error `, 400));
  }
};
