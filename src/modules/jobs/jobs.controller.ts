import { Request, Response, NextFunction } from "express";
import { AppError } from "../../lib/utils/app-error";
import { JobModel } from "../../../db/models/jobs-model";
import { CompanyModel } from "../../../db/models/company-model";
import { buildQuery, QueryParams } from "../../lib/build-query";
import { UserModel } from "../../../db/models/user-model";
import { uploadCV } from "../../lib/upload-file";
import { ApplicationModel } from "../../../db/models/application-model";

export const addJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await (req as any).user;

  if (!user) {
    return next(new AppError("Unauthorized", 401));
  }
  try {
    const userCompany = await CompanyModel.findOne({
      hr: user._id,
    }).exec();

    if (!userCompany) {
      return next(new AppError("User is not a HR in any company", 401));
    }

    const job = await JobModel.create({
      ...req.body,
      hr: user._id,
      company: userCompany?._id,
    });

    if (!job) {
      return next(new AppError("Job not created", 400));
    }

    res.status(201).json({
      status: "success",
      data: job,
    });
  } catch (err) {
    console.log(err);
    next(new AppError("Error creating Job", 400));
  }
};

export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return next(new AppError("Invalid job id", 400));
    }

    const job = await JobModel.findByIdAndUpdate(jobId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!job) {
      return next(new AppError("Job not found", 404));
    }

    res.json({ message: "Job updated", job });
  } catch (error: any) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};

export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return next(new AppError("Invalid job id", 400));
    }

    const job = await JobModel.findByIdAndDelete(jobId);

    if (!job) {
      return next(new AppError("Job not found", 404));
    }

    res.json({ message: "Job deleted", job });
  } catch (error: any) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};

export const getJobsInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobsWithHrCompany = await JobModel.find().populate("company");

    res.json({ message: "Jobs with HR and Company", jobs: jobsWithHrCompany });
  } catch (error: any) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};

export const getCompanyJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyName } = req.query;

    if (!companyName) {
      return next(new AppError("Company name is required", 400));
    }

    const company = await CompanyModel.findOne({
      name: { $regex: new RegExp(companyName as string, "i") },
    });

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const jobs = await JobModel.find({ company: company._id });

    res.json({ message: `Jobs in company`, jobs });
  } catch (error: any) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};

export const getFilteredJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = buildQuery(req.query as QueryParams);

    const jobs = await JobModel.find(query);

    res.json({ message: `Filtered jobs`, jobs });
  } catch (error) {
    console.log(error);
    next(new AppError("Error", 400));
  }
};

export const applyToJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await (req as any).user;

  if (!user) {
    return next(new AppError("Unauthorized", 401));
  }
  try {
    const { jobId } = req.params;
    const { techSkills } = req.body;

    if (!jobId) {
      return next(new AppError("Invalid job id", 400));
    }

    const job = await JobModel.findById(jobId);
    const userData = await UserModel.findById(user._id);

    if (!job) {
      return next(new AppError("Job not found", 404));
    }

    const file = req.file;

    if (!file) {
      return next(new AppError("File is required", 400));
    }
    const fileName = `${
      Math.random() + Math.random() * 17634
    }-${Date.now()}.pdf`;

    const uploadRes = await uploadCV(
      file.buffer,
      fileName,
      true,
      file.mimetype
    );

    if (uploadRes.error) {
      return next(new AppError("Error uploading file", 400));
    }

    const application = await ApplicationModel.create({
      job: job._id,
      userId: user._id,
      userTechSkills: techSkills,
      userResume: uploadRes.url,
    });

    res.json({ message: "Applied to job", application });
  } catch (error: any) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};
