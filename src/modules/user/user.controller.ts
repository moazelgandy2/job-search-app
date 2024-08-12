import { Request, Response, NextFunction } from "express";

import { UserModel } from "../../../db/models/user-model";
import { AppError } from "../../lib/utils/app-error";

import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../lib/send-email";

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const hashedPassword = await bcryptjs.hash(req.body.password, 8);
  const user = await UserModel.create({
    ...req.body,
    password: hashedPassword,
    userName: req.body.firstName + req.body.lastName,
  });

  res.status(201).json({ message: "User created successfully", user });
};

export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await UserModel.findOne({
    email: req.body.email,
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
  user.password = undefined as any;
  const token = jwt.sign({ user }, "secret");

  return res
    .status(200)
    .json({ message: "User logged in successfully", token });
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return next(new AppError("User not found", 404));
    }

    const user = await UserModel.findById({
      _id: userId,
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
        userName,
      },
      { new: true }
    );

    if (!updatedUser) return next(new AppError("User not found", 404));

    updatedUser.password = undefined as any;

    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error: any) {
    next(new AppError(`Erorrrrr`, 500));
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return next(new AppError("User not found", 404));
    }

    const user = await UserModel.findById({
      _id: userId,
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    await UserModel.findByIdAndDelete(userId);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    next(new AppError(`Error Deleting user`, 500));
  }
};

export const getUserData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return next(new AppError("User not found", 404));
    }

    const user = await UserModel.findById({
      _id: userId,
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    user.password = undefined as any;

    res.status(200).json({ message: "User profile has been found", user });
  } catch (error: any) {
    next(new AppError(`Error fetching user`, 500));
  }
};

export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError("User not found", 404));
    }

    const user = await UserModel.findOne({
      email,
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
        $unset: { otp: 1 },
      },
      { new: true }
    );

    if (!updatedUser) return next(new AppError("User not found", 404));

    updatedUser.password = undefined as any;

    return res
      .status(200)
      .json({ message: "Password updated successfully", updatedUser });
  } catch (error: any) {
    console.log(error);
    next(new AppError(`Error fetching user`, 500));
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError("User not found", 404));
    }

    const user = await UserModel.findOne({
      email: email,
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }
    const otp = Math.floor(1000 + Math.random() * 9000);
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
        otp,
      },
      { new: true }
    );

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error: any) {
    console.log(error);
    return next(new AppError(`Error fetching user`, 500));
  }
};

export const getRecoveryEmailUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { recoveryEmail } = req.body;

    if (!recoveryEmail) {
      return next(new AppError("User not found", 404));
    }

    const users = await UserModel.find({
      recoveryEmail: recoveryEmail,
    });

    if (!users) {
      return next(new AppError("No users found", 404));
    }

    users.map((user) => (user.password = undefined as any));

    res.status(200).json({ message: "Users profiles has been found", users });
  } catch (error: any) {
    next(new AppError(`Error fetching users`, 500));
  }
};
