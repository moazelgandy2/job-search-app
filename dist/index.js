// src/index.ts
import express from "express";
import "dotenv/config";

// db/connect.ts
import mongoose from "mongoose";
var db = () => {
  mongoose.set("strictQuery", true);
  mongoose.connect(process.env.MONGO_DB_URL).then(() => {
    console.log("Connected to MongoDB");
  }).catch((err) => {
    console.error("Error connecting to MongoDB: ", err);
  });
};

// src/lib/utils/app-error.ts
var AppError = class extends Error {
  statusCode;
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
};

// src/modules/user/user.routes.ts
import { Router } from "express";

// db/models/user-model.ts
import mongoose2 from "mongoose";
var userSchema = new mongoose2.Schema(
  {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    recoveryEmail: {
      type: String,
      required: true
    },
    DOB: {
      type: Date,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["user", "hr"],
      default: "user",
      required: true
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
      required: true
    },
    otp: {
      type: Number,
      required: false
    }
  },
  {
    timestamps: true
  }
);
var UserModel = mongoose2.model("User", userSchema);

// src/modules/user/user.controller.ts
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

// src/lib/send-email.ts
import nodemailer from "nodemailer";
var sendEmail = async (email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
      }
    });
    const mailOptions = {
      from: process.env.EMAIL_SERVER_USER,
      to: email,
      subject,
      text: message
    };
    const info = await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.log("Error sending email", error);
    return { success: false };
  }
};

// src/modules/user/user.controller.ts
var signUp = async (req, res, next) => {
  const hashedPassword = await bcryptjs.hash(req.body.password, 8);
  const user = await UserModel.create({
    ...req.body,
    password: hashedPassword,
    userName: req.body.firstName + req.body.lastName
  });
  res.status(201).json({ message: "User created successfully", user });
};
var signIn = async (req, res, next) => {
  const user = await UserModel.findOne({
    email: req.body.email
  });
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  const validPassword = await bcryptjs.compare(
    req.body.password,
    user.password
  );
  if (!validPassword) {
    return next(new AppError("Invalid password", 401));
  }
  user.password = void 0;
  const token = jwt.sign({ user }, "secret");
  return res.status(200).json({ message: "User logged in successfully", token });
};
var updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return next(new AppError("User not found", 404));
    }
    const user = await UserModel.findById({
      _id: userId
    });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    if (!req.body.firstName) {
      req.body.firstName = user?.firstName;
    }
    if (!req.body.lastName) {
      req.body.lastName = user?.lastName;
    }
    const userName = req.body.firstName + req.body.lastName;
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        userName
      },
      { new: true }
    );
    if (!updatedUser) return next(new AppError("User not found", 404));
    updatedUser.password = void 0;
    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    next(new AppError(`Erorrrrr`, 500));
  }
};
var deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return next(new AppError("User not found", 404));
    }
    const user = await UserModel.findById({
      _id: userId
    });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    await UserModel.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(new AppError(`Error Deleting user`, 500));
  }
};
var getUserData = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return next(new AppError("User not found", 404));
    }
    const user = await UserModel.findById({
      _id: userId
    });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    user.password = void 0;
    res.status(200).json({ message: "User profile has been found", user });
  } catch (error) {
    next(new AppError(`Error fetching user`, 500));
  }
};
var updatePassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError("User not found", 404));
    }
    const user = await UserModel.findOne({
      email
    });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    if (!req.body.otp) {
      const validPassword = await bcryptjs.compare(
        req.body.oldPassword,
        user.password
      );
      if (!validPassword) {
        return next(new AppError("Invalid password", 401));
      }
    }
    if (req.body.otp != user.otp) {
      return next(new AppError("Invalid OTP", 401));
    }
    const hashedPassword = await bcryptjs.hash(req.body.newPassword, 8);
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
        $unset: { otp: 1 }
      },
      { new: true }
    );
    if (!updatedUser) return next(new AppError("User not found", 404));
    updatedUser.password = void 0;
    return res.status(200).json({ message: "Password updated successfully", updatedUser });
  } catch (error) {
    console.log(error);
    next(new AppError(`Error fetching user`, 500));
  }
};
var resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next(new AppError("User not found", 404));
    }
    const user = await UserModel.findOne({
      email
    });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    const otp = Math.floor(1e3 + Math.random() * 9e3);
    const mail = await sendEmail(
      [email, user.recoveryEmail],
      `Reset Password OTP`,
      `OTP: ${otp},  The OTP for password reset for ${email}, please note that this OTP has been sent to your recovery email ${user.recoveryEmail} as well.`
    );
    if (!mail.success) {
      return res.status(500).json({ message: "Error sending email" });
    }
    await UserModel.findByIdAndUpdate(
      user._id,
      {
        otp
      },
      { new: true }
    );
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.log(error);
    return next(new AppError(`Error fetching user`, 500));
  }
};
var getRecoveryEmailUsers = async (req, res, next) => {
  try {
    const { recoveryEmail } = req.body;
    if (!recoveryEmail) {
      return next(new AppError("User not found", 404));
    }
    const users = await UserModel.find({
      recoveryEmail
    });
    if (!users) {
      return next(new AppError("No users found", 404));
    }
    users.map((user) => user.password = void 0);
    res.status(200).json({ message: "Users profiles has been found", users });
  } catch (error) {
    next(new AppError(`Error fetching users`, 500));
  }
};

// src/lib/find-user.ts
var CheckEmailValidity = async (req, res, next) => {
  try {
    if (req.originalUrl == "/update" && !req.body.email) {
      return next();
    }
    const user = await UserModel.findOne({
      email: req.body.email
    });
    if (user) {
      return res.status(409).json({ message: "User with this email already exist" });
    } else {
      next();
    }
  } catch (error) {
    next(new AppError(error, 500));
  }
};

// src/middlewares/validate.ts
var validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false
    });
    if (error) {
      return next(
        new AppError(
          error.details.map((err) => err.message).join(", "),
          400
        )
      );
    }
    next();
  };
};

// src/modules/user/user.validation.ts
import Joi from "joi";
var signUpSchema = Joi.object({
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.valid(Joi.ref("password")).required(),
  recoveryEmail: Joi.string().email().required(),
  DOB: Joi.date().required(),
  phoneNumber: Joi.string().required().min(11).max(11),
  role: Joi.string().valid("user", "hr"),
  status: Joi.string().valid("online", "offline")
});
var signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});
var updateUserSchema = Joi.object({
  firstName: Joi.string().min(2),
  lastName: Joi.string(),
  email: Joi.string().email(),
  recoveryEmail: Joi.string().email(),
  DOB: Joi.date(),
  phoneNumber: Joi.string()
});
var updatePasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  oldPassword: Joi.string(),
  newPassword: Joi.string().required(),
  confirmPassword: Joi.valid(Joi.ref("newPassword")).required(),
  otp: Joi.number()
});
var recoveryEmailUsersSchema = Joi.object({
  recoveryEmail: Joi.string().email().required()
});

// src/middlewares/auth.ts
import jwt2 from "jsonwebtoken";

// db/models/company-model.ts
import mongoose3 from "mongoose";
var companySchema = new mongoose3.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    industry: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    employeesNumber: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    hr: {
      type: mongoose3.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);
var CompanyModel = mongoose3.model("Company", companySchema);

// src/middlewares/auth.ts
var checkAuth = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return next(new AppError("Unauthorized", 401));
    }
    const validToken = jwt2.verify(token, "secret");
    if (!validToken) {
      return next(new AppError("Unauthorized", 401));
    }
    const decodedToken = jwt2.decode(token);
    if (req.originalUrl == "/users/info/me" || req.originalUrl == "/users/password" || req.originalUrl == "/users/recovery-email-users" || req.originalUrl.startsWith("/company") || req.originalUrl.startsWith("/jobs") || req.originalUrl.startsWith("/company/applications")) {
      req.params.userId = decodedToken.user._id;
    }
    if (decodedToken.user._id != req.params.userId && !req.originalUrl.startsWith("/users/info")) {
      return next(new AppError("Unauthorized", 401));
    }
    if (!decodedToken) {
      return next(new AppError("Unauthorized", 401));
    }
    req.user = decodedToken.user;
    next();
  } catch (error) {
    return next(new AppError("Error", 401));
  }
};
var validateRole = async (req, res, next) => {
  const role = req.user.role;
  if (role != "hr") {
    return next(new AppError(`Only HR can access this route`, 401));
  }
  if (req.originalUrl == "/company" && req.method == "POST") {
    return next();
  }
  if (req.originalUrl.startsWith("/company") && req.method == "DELETE") {
    const company2 = await CompanyModel.findOne({
      _id: req.params.companyId
    });
    return next();
  }
  if (!req.originalUrl.startsWith("/company")) {
    return next();
  }
  if (req.originalUrl.startsWith("/company/applications")) {
    const userCompany = await CompanyModel.findOne({
      hr: req.user._id
    });
    if (!userCompany) {
      return next(new AppError(`Unauthorized, users company not found.`, 401));
    }
    return next();
  }
  const company = await CompanyModel.findOne({
    _id: req.params.companyId,
    hr: req.user._id
  });
  if (!company) {
    console.log("Company not found");
    return next(new AppError(`Unauthorized, users company not found.`, 401));
  }
  next();
};

// src/modules/user/user.routes.ts
var userRouter = Router();
userRouter.post("/signup", validate(signUpSchema), CheckEmailValidity, signUp);
userRouter.post("/signin", validate(signInSchema), signIn);
userRouter.patch(
  "/:userId",
  checkAuth,
  validate(updateUserSchema),
  CheckEmailValidity,
  updateUser
);
userRouter.delete("/:userId", checkAuth, deleteUser);
userRouter.get("/info/me", checkAuth, getUserData);
userRouter.get("/info/:userId", checkAuth, getUserData);
userRouter.put(
  "/password",
  validate(updatePasswordSchema),
  checkAuth,
  updatePassword
);
userRouter.post("/reset-password", resetPassword);
userRouter.post(
  "/recovery-email-users",
  validate(recoveryEmailUsersSchema),
  checkAuth,
  getRecoveryEmailUsers
);
var user_routes_default = userRouter;

// src/modules/company/company.routes.ts
import { Router as Router2 } from "express";

// src/modules/company/company.valudation.ts
import Joi2 from "joi";
var createCompanyValidation = Joi2.object({
  name: Joi2.string().required(),
  description: Joi2.string().required(),
  industry: Joi2.string().required(),
  address: Joi2.string().required(),
  employeesNumber: Joi2.string().required(),
  email: Joi2.string().required(),
  hr: Joi2.string().hex().length(24).required()
});
var updateCompanyValidation = Joi2.object({
  name: Joi2.string(),
  description: Joi2.string(),
  industry: Joi2.string(),
  address: Joi2.string(),
  employeesNumber: Joi2.string(),
  email: Joi2.string(),
  hr: Joi2.string().hex().length(24)
});

// src/modules/company/company.controller.ts
import mongoose5, { isValidObjectId } from "mongoose";

// db/models/application-model.ts
import mongoose4 from "mongoose";
var applicationSchema = new mongoose4.Schema(
  {
    job: {
      type: mongoose4.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    userId: {
      type: mongoose4.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userTechSkills: {
      type: [String],
      required: true
    },
    userResume: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);
var ApplicationModel = mongoose4.model(
  "Application",
  applicationSchema
);

// src/lib/generate-excel.ts
import XLSX from "xlsx";

// src/lib/upload-file.ts
import { uploadBytesResumable, getDownloadURL, ref } from "firebase/storage";

// src/lib/fire-base.ts
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
var firebaseConfig = {
  apiKey: process.env.FIRE_BASE_API_KEY,
  authDomain: process.env.FIRE_BASE_AUTH_DOMAIN,
  projectId: process.env.FIRE_BASE_PROJECT_ID,
  storageBucket: process.env.FIRE_BASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIRE_BASE_MESSAGING_SENDER_ID,
  appId: process.env.FIRE_BASE_APP_ID,
  measurementId: process.env.FIRE_BASE_MEASUREMENT_ID
};
var app = initializeApp(firebaseConfig);
var storage = getStorage(app);

// src/lib/upload-file.ts
var uploadCV = async (buffer, fileName, cv, type) => {
  const fileRef = ref(
    storage,
    `job-search-app/${cv ? "/cv" : "/files"}/${fileName}`
  );
  const metadata = {
    contentType: type
  };
  try {
    const snapShot = await uploadBytesResumable(
      fileRef,
      buffer,
      metadata
    );
    const downloadURL = await getDownloadURL(snapShot.ref);
    return { success: "File uploaded", url: downloadURL };
  } catch (err) {
    console.log("Error", err);
    return { error: "Error uploading file" };
  }
};

// src/lib/generate-excel.ts
async function generateCompanyApplicationsExcel(companyId, date) {
  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    const applications = await ApplicationModel.find({
      job: { $exists: true },
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate({
      path: "job",
      select: "title location workingTime level description techSkills softSkills",
      match: { company: companyId }
    }).populate({
      path: "userId",
      select: "firstName lastName email phoneNumber DOB role"
    }).lean();
    const filteredApplications = applications.filter((app3) => app3.job !== null);
    if (filteredApplications.length === 0) {
      console.log("No applications found for the specified date and company!");
      return {
        empty: "No applications found for the specified date and company!"
      };
    }
    const data = filteredApplications.map((application) => {
      delete application.job._id;
      return {
        ...application.job,
        techSkills: application.job.techSkills.join(", "),
        softSkills: application.job.softSkills.join(", "),
        ...application.userId,
        UserResume: application.userResume,
        ApplicationDate: application.createdAt.toISOString().split("T")[0]
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Applications");
    const fileName = `Applications_${companyId}_${date}.xlsx`;
    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const res = await uploadCV(
      excelBuffer,
      fileName,
      false,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    if (res.error) {
      console.log("Error uploading Excel file to Firebase");
      return { error: "Error uploading Excel file to Firebase" };
    }
    return { success: "Excel file uploaded", url: res.url };
  } catch (err) {
    console.error("Error generating Excel file:", err);
  }
}

// src/lib/utils/parse-data.ts
var parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split("-").map(Number);
  const fullYear = year < 100 ? year + 2e3 : year;
  return new Date(fullYear, month - 1, day);
};

// src/modules/company/company.controller.ts
var addCompany = async (req, res, next) => {
  try {
    const user = await UserModel.findById({
      _id: req.body.hr
    });
    if (!user) {
      return next(new AppError("User not found", 404));
    }
    const validEmail = await CompanyModel.findOne({}).where("email").equals(req.body.email);
    if (validEmail) {
      return next(new AppError("Email already exists", 400));
    }
    const company = await CompanyModel.create({
      ...req.body,
      hr: new mongoose5.Types.ObjectId(req.body.hr)
    });
    if (!company) return next(new AppError("Company not created", 400));
    if (user.role != "hr") {
      await user.updateOne({
        _id: req.body.hr,
        role: "hr"
      });
    }
    res.json({ message: "Company created", company });
  } catch (error) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};
var updateCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    if (!isValidObjectId(companyId)) {
      return next(new AppError("Invalid company id", 400));
    }
    const company = await CompanyModel.findById(companyId);
    if (!company) {
      return next(new AppError("Company not found", 404));
    }
    const validEmail = await CompanyModel.findOne({}).where("email").equals(req.body.email);
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
  } catch (error) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};
var deleteCompany = async (req, res, next) => {
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
  } catch (error) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};
var getCompanyApplications = async (req, res, next) => {
  try {
    const user = req.user;
    const { jobId } = req.params;
    const hex24Regex = /^[a-fA-F0-9]{24}$/;
    const validJobId = hex24Regex.test(jobId);
    if (!validJobId) {
      return next(new AppError("Invalid job id", 400));
    }
    const userCompany = await CompanyModel.findOne({
      hr: user._id
    });
    if (!userCompany) {
      return next(new AppError(`Unauthorized, users company not found.`, 401));
    }
    const companyApplications = await ApplicationModel.find({
      job: jobId
    }).populate({ path: "job" }).populate({ path: "userId" }).lean();
    const jobDetails = companyApplications.length > 0 ? companyApplications[0].job : null;
    const usersInfo = companyApplications.map((application) => ({
      _id: application.userId._id,
      firstName: application.userId.firstName,
      lastName: application.userId.lastName,
      userName: application.userId.userName,
      email: application.userId.email,
      phoneNumber: application.userId.phoneNumber,
      role: application.userId.role,
      status: application.userId.status,
      userTechSkills: application.userTechSkills,
      userResume: application.userResume
    }));
    const response = {
      job: jobDetails,
      usersInfo,
      jobId
    };
    res.json({ response });
  } catch (error) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};
var generateSheet = async (req, res, next) => {
  try {
    const { companyId, date } = req.query;
    if (!companyId || !date) {
      return next(new AppError("Company id and date are required", 400));
    }
    const dateStr = date;
    const parsedDate = await parseDate(dateStr);
    const hex24Regex = /^[a-fA-F0-9]{24}$/;
    const validJobId = hex24Regex.test(companyId);
    if (!validJobId) {
      return next(new AppError("Invalid company id", 400));
    }
    const company = await CompanyModel.findOne({
      _id: companyId
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
  } catch (error) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};

// src/modules/company/company.routes.ts
var companyRouter = Router2();
companyRouter.post(
  "/",
  validate(createCompanyValidation),
  checkAuth,
  validateRole,
  addCompany
);
companyRouter.patch(
  "/:companyId",
  validate(updateCompanyValidation),
  checkAuth,
  validateRole,
  updateCompany
);
companyRouter.delete("/:companyId", checkAuth, validateRole, deleteCompany);
companyRouter.get(
  "/applications/:jobId",
  checkAuth,
  validateRole,
  getCompanyApplications
);
companyRouter.get("/analytics", generateSheet);
var company_routes_default = companyRouter;

// src/modules/jobs/jobs.routes.ts
import { Router as Router3 } from "express";

// db/models/jobs-model.ts
import mongoose6 from "mongoose";
var jobSchema = new mongoose6.Schema(
  {
    title: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true,
      enum: ["remote", "onsite", "hybrid"]
    },
    workingTime: {
      type: String,
      required: true,
      enum: ["full-time", "part-time"]
    },
    level: {
      type: String,
      required: true,
      enum: ["Junior", "Mid-Level", "Senior", "Team-Lead", "CTO"]
    },
    description: {
      type: String,
      required: true
    },
    techSkills: {
      type: [String],
      required: true
    },
    softSkills: {
      type: [String],
      required: true
    },
    hr: {
      type: mongoose6.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    company: {
      type: mongoose6.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    }
  },
  {
    timestamps: true
  }
);
var JobModel = mongoose6.model("Job", jobSchema);

// src/lib/build-query.ts
var buildQuery = (params) => {
  const { title, workingTime, location, level, skills } = params;
  const query = {};
  if (title) {
    query.title = new RegExp(title, "i");
  }
  if (workingTime) {
    query.workingTime = new RegExp(workingTime, "i");
  }
  if (location) {
    query.location = new RegExp(location, "i");
  }
  if (level) {
    query.level = new RegExp(level, "i");
  }
  if (skills) {
    const skillsArray = skills.split(",").map((skill) => new RegExp(skill.trim(), "i"));
    query.techSkills = { $elemMatch: { $in: skillsArray } };
  }
  return query;
};

// src/modules/jobs/jobs.controller.ts
var addJob = async (req, res, next) => {
  const user = await req.user;
  if (!user) {
    return next(new AppError("Unauthorized", 401));
  }
  try {
    const userCompany = await CompanyModel.findOne({
      hr: user._id
    }).exec();
    if (!userCompany) {
      return next(new AppError("User is not a HR in any company", 401));
    }
    const job = await JobModel.create({
      ...req.body,
      hr: user._id,
      company: userCompany?._id
    });
    if (!job) {
      return next(new AppError("Job not created", 400));
    }
    res.status(201).json({
      status: "success",
      data: job
    });
  } catch (err) {
    console.log(err);
    next(new AppError("Error creating Job", 400));
  }
};
var updateJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return next(new AppError("Invalid job id", 400));
    }
    const job = await JobModel.findByIdAndUpdate(jobId, req.body, {
      new: true,
      runValidators: true
    });
    if (!job) {
      return next(new AppError("Job not found", 404));
    }
    res.json({ message: "Job updated", job });
  } catch (error) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};
var deleteJob = async (req, res, next) => {
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
  } catch (error) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};
var getJobsInfo = async (req, res, next) => {
  try {
    const jobsWithHrCompany = await JobModel.find().populate("company");
    res.json({ message: "Jobs with HR and Company", jobs: jobsWithHrCompany });
  } catch (error) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};
var getCompanyJobs = async (req, res, next) => {
  try {
    const { companyName } = req.query;
    if (!companyName) {
      return next(new AppError("Company name is required", 400));
    }
    const company = await CompanyModel.findOne({
      name: { $regex: new RegExp(companyName, "i") }
    });
    if (!company) {
      return next(new AppError("Company not found", 404));
    }
    const jobs = await JobModel.find({ company: company._id });
    res.json({ message: `Jobs in company`, jobs });
  } catch (error) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};
var getFilteredJobs = async (req, res, next) => {
  try {
    const query = buildQuery(req.query);
    const jobs = await JobModel.find(query);
    res.json({ message: `Filtered jobs`, jobs });
  } catch (error) {
    console.log(error);
    next(new AppError("Error", 400));
  }
};
var applyToJob = async (req, res, next) => {
  const user = await req.user;
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
    const fileName = `${Math.random() + Math.random() * 17634}-${Date.now()}.pdf`;
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
      userResume: uploadRes.url
    });
    res.json({ message: "Applied to job", application });
  } catch (error) {
    console.log(error);
    return next(new AppError(`Error `, 400));
  }
};

// src/modules/jobs/jobs.routes.ts
import multer from "multer";

// src/modules/jobs/jobs.validation.ts
import Joi3 from "joi";
var createJobValidation = Joi3.object({
  title: Joi3.string().required(),
  location: Joi3.string().valid("remote", "onsite", "hybrid").required(),
  workingTime: Joi3.string().valid("full-time", "part-time").required(),
  level: Joi3.string().valid("Junior", "Mid-Level", "Senior", "Team-Lead", "CTO").required(),
  description: Joi3.string().required(),
  techSkills: Joi3.array().items(Joi3.string()).required(),
  softSkills: Joi3.array().items(Joi3.string()).required()
});
var updateJobValidation = Joi3.object({
  title: Joi3.string(),
  location: Joi3.string().valid("remote", "onsite", "hybrid"),
  workingTime: Joi3.string().valid("full-time", "part-time"),
  level: Joi3.string().valid(
    "Junior",
    "Mid-Level",
    "Senior",
    "Team-Lead",
    "CTO"
  ),
  description: Joi3.string(),
  techSkills: Joi3.array().items(Joi3.string()),
  softSkills: Joi3.array().items(Joi3.string())
});

// src/modules/jobs/jobs.routes.ts
var upload = multer({ storage: multer.memoryStorage() });
var jobsRouter = Router3();
jobsRouter.get("/", checkAuth, getJobsInfo);
jobsRouter.get("/filter", checkAuth, getFilteredJobs);
jobsRouter.post(
  "/",
  validate(createJobValidation),
  checkAuth,
  validateRole,
  addJob
);
jobsRouter.get(`/company`, checkAuth, getCompanyJobs);
jobsRouter.patch(
  "/:jobId",
  validate(updateJobValidation),
  checkAuth,
  validateRole,
  updateJob
);
jobsRouter.delete("/:jobId", checkAuth, validateRole, deleteJob);
jobsRouter.post("/apply/:jobId", checkAuth, upload.single("file"), applyToJob);
var jobs_routes_default = jobsRouter;

// src/index.ts
var app2 = express();
var port = 8080;
app2.use(express.json());
db();
app2.use("/users", user_routes_default);
app2.use("/company", company_routes_default);
app2.use("/jobs", jobs_routes_default);
app2.use("*", (req, res, next) => {
  next(new AppError(`Route not found ${req.originalUrl}`, 404));
});
app2.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode).json({ error: err.message });
});
app2.listen(port, () => console.log(`Example app listening on port ${port}!`));
