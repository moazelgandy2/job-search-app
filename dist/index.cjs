"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_express4 = __toESM(require("express"), 1);
var import_config = require("dotenv/config");

// db/connect.ts
var import_mongoose = __toESM(require("mongoose"), 1);
var db = () => {
  import_mongoose.default.set("strictQuery", true);
  import_mongoose.default.connect(process.env.MONGO_DB_URL).then(() => {
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
var import_express = require("express");

// db/models/user-model.ts
var import_mongoose2 = __toESM(require("mongoose"), 1);
var userSchema = new import_mongoose2.default.Schema(
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
var UserModel = import_mongoose2.default.model("User", userSchema);

// src/modules/user/user.controller.ts
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);

// src/lib/send-email.ts
var import_nodemailer = __toESM(require("nodemailer"), 1);
var sendEmail = async (email, subject, message) => {
  try {
    const transporter = import_nodemailer.default.createTransport({
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
  const hashedPassword = await import_bcryptjs.default.hash(req.body.password, 8);
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
  const validPassword = await import_bcryptjs.default.compare(
    req.body.password,
    user.password
  );
  if (!validPassword) {
    return next(new AppError("Invalid password", 401));
  }
  user.password = void 0;
  const token = import_jsonwebtoken.default.sign({ user }, "secret");
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
      const validPassword = await import_bcryptjs.default.compare(
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
    const hashedPassword = await import_bcryptjs.default.hash(req.body.newPassword, 8);
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
var import_joi = __toESM(require("joi"), 1);
var signUpSchema = import_joi.default.object({
  firstName: import_joi.default.string().min(2).required(),
  lastName: import_joi.default.string().required(),
  email: import_joi.default.string().email().required(),
  password: import_joi.default.string().required(),
  confirmPassword: import_joi.default.valid(import_joi.default.ref("password")).required(),
  recoveryEmail: import_joi.default.string().email().required(),
  DOB: import_joi.default.date().required(),
  phoneNumber: import_joi.default.string().required().min(11).max(11),
  role: import_joi.default.string().valid("user", "hr"),
  status: import_joi.default.string().valid("online", "offline")
});
var signInSchema = import_joi.default.object({
  email: import_joi.default.string().email().required(),
  password: import_joi.default.string().required()
});
var updateUserSchema = import_joi.default.object({
  firstName: import_joi.default.string().min(2),
  lastName: import_joi.default.string(),
  email: import_joi.default.string().email(),
  recoveryEmail: import_joi.default.string().email(),
  DOB: import_joi.default.date(),
  phoneNumber: import_joi.default.string()
});
var updatePasswordSchema = import_joi.default.object({
  email: import_joi.default.string().email().required(),
  oldPassword: import_joi.default.string(),
  newPassword: import_joi.default.string().required(),
  confirmPassword: import_joi.default.valid(import_joi.default.ref("newPassword")).required(),
  otp: import_joi.default.number()
});
var recoveryEmailUsersSchema = import_joi.default.object({
  recoveryEmail: import_joi.default.string().email().required()
});

// src/middlewares/auth.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);

// db/models/company-model.ts
var import_mongoose3 = __toESM(require("mongoose"), 1);
var companySchema = new import_mongoose3.default.Schema(
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
      type: import_mongoose3.default.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);
var CompanyModel = import_mongoose3.default.model("Company", companySchema);

// src/middlewares/auth.ts
var checkAuth = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return next(new AppError("Unauthorized", 401));
    }
    const validToken = import_jsonwebtoken2.default.verify(token, "secret");
    if (!validToken) {
      return next(new AppError("Unauthorized", 401));
    }
    const decodedToken = import_jsonwebtoken2.default.decode(token);
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
var userRouter = (0, import_express.Router)();
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
var import_express2 = require("express");

// src/modules/company/company.valudation.ts
var import_joi2 = __toESM(require("joi"), 1);
var createCompanyValidation = import_joi2.default.object({
  name: import_joi2.default.string().required(),
  description: import_joi2.default.string().required(),
  industry: import_joi2.default.string().required(),
  address: import_joi2.default.string().required(),
  employeesNumber: import_joi2.default.string().required(),
  email: import_joi2.default.string().required(),
  hr: import_joi2.default.string().hex().length(24).required()
});
var updateCompanyValidation = import_joi2.default.object({
  name: import_joi2.default.string(),
  description: import_joi2.default.string(),
  industry: import_joi2.default.string(),
  address: import_joi2.default.string(),
  employeesNumber: import_joi2.default.string(),
  email: import_joi2.default.string(),
  hr: import_joi2.default.string().hex().length(24)
});

// src/modules/company/company.controller.ts
var import_mongoose5 = __toESM(require("mongoose"), 1);

// db/models/application-model.ts
var import_mongoose4 = __toESM(require("mongoose"), 1);
var applicationSchema = new import_mongoose4.default.Schema(
  {
    job: {
      type: import_mongoose4.default.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    userId: {
      type: import_mongoose4.default.Schema.Types.ObjectId,
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
var ApplicationModel = import_mongoose4.default.model(
  "Application",
  applicationSchema
);

// src/lib/generate-excel.ts
var import_xlsx = __toESM(require("xlsx"), 1);

// src/lib/upload-file.ts
var import_storage2 = require("firebase/storage");

// src/lib/fire-base.ts
var import_app = require("firebase/app");
var import_storage = require("firebase/storage");
var firebaseConfig = {
  apiKey: process.env.FIRE_BASE_API_KEY,
  authDomain: process.env.FIRE_BASE_AUTH_DOMAIN,
  projectId: process.env.FIRE_BASE_PROJECT_ID,
  storageBucket: process.env.FIRE_BASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIRE_BASE_MESSAGING_SENDER_ID,
  appId: process.env.FIRE_BASE_APP_ID,
  measurementId: process.env.FIRE_BASE_MEASUREMENT_ID
};
var app = (0, import_app.initializeApp)(firebaseConfig);
var storage = (0, import_storage.getStorage)(app);

// src/lib/upload-file.ts
var uploadCV = async (buffer, fileName, cv, type) => {
  const fileRef = (0, import_storage2.ref)(
    storage,
    `job-search-app/${cv ? "/cv" : "/files"}/${fileName}`
  );
  const metadata = {
    contentType: type
  };
  try {
    const snapShot = await (0, import_storage2.uploadBytesResumable)(
      fileRef,
      buffer,
      metadata
    );
    const downloadURL = await (0, import_storage2.getDownloadURL)(snapShot.ref);
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
    const ws = import_xlsx.default.utils.json_to_sheet(data);
    const wb = import_xlsx.default.utils.book_new();
    import_xlsx.default.utils.book_append_sheet(wb, ws, "Applications");
    const fileName = `Applications_${companyId}_${date}.xlsx`;
    const excelBuffer = import_xlsx.default.write(wb, { type: "buffer", bookType: "xlsx" });
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
      hr: new import_mongoose5.default.Types.ObjectId(req.body.hr)
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
    if (!(0, import_mongoose5.isValidObjectId)(companyId)) {
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
    if (!(0, import_mongoose5.isValidObjectId)(companyId)) {
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
var companyRouter = (0, import_express2.Router)();
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
var import_express3 = require("express");

// db/models/jobs-model.ts
var import_mongoose6 = __toESM(require("mongoose"), 1);
var jobSchema = new import_mongoose6.default.Schema(
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
      type: import_mongoose6.default.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    company: {
      type: import_mongoose6.default.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    }
  },
  {
    timestamps: true
  }
);
var JobModel = import_mongoose6.default.model("Job", jobSchema);

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
var import_multer = __toESM(require("multer"), 1);

// src/modules/jobs/jobs.validation.ts
var import_joi3 = __toESM(require("joi"), 1);
var createJobValidation = import_joi3.default.object({
  title: import_joi3.default.string().required(),
  location: import_joi3.default.string().valid("remote", "onsite", "hybrid").required(),
  workingTime: import_joi3.default.string().valid("full-time", "part-time").required(),
  level: import_joi3.default.string().valid("Junior", "Mid-Level", "Senior", "Team-Lead", "CTO").required(),
  description: import_joi3.default.string().required(),
  techSkills: import_joi3.default.array().items(import_joi3.default.string()).required(),
  softSkills: import_joi3.default.array().items(import_joi3.default.string()).required()
});
var updateJobValidation = import_joi3.default.object({
  title: import_joi3.default.string(),
  location: import_joi3.default.string().valid("remote", "onsite", "hybrid"),
  workingTime: import_joi3.default.string().valid("full-time", "part-time"),
  level: import_joi3.default.string().valid(
    "Junior",
    "Mid-Level",
    "Senior",
    "Team-Lead",
    "CTO"
  ),
  description: import_joi3.default.string(),
  techSkills: import_joi3.default.array().items(import_joi3.default.string()),
  softSkills: import_joi3.default.array().items(import_joi3.default.string())
});

// src/modules/jobs/jobs.routes.ts
var upload = (0, import_multer.default)({ storage: import_multer.default.memoryStorage() });
var jobsRouter = (0, import_express3.Router)();
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
var app2 = (0, import_express4.default)();
var port = 8080;
app2.use(import_express4.default.json());
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
