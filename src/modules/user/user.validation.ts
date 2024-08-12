import Joi from "joi";

export const signUpSchema = Joi.object({
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  confirmPassword: Joi.valid(Joi.ref("password")).required(),
  recoveryEmail: Joi.string().email().required(),
  DOB: Joi.date().required(),
  phoneNumber: Joi.string().required().min(11).max(11),
  role: Joi.string().valid("user", "hr"),
  status: Joi.string().valid("online", "offline"),
});

export const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2),
  lastName: Joi.string(),
  email: Joi.string().email(),
  recoveryEmail: Joi.string().email(),
  DOB: Joi.date(),
  phoneNumber: Joi.string(),
});

export const updatePasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  oldPassword: Joi.string(),
  newPassword: Joi.string().required(),
  confirmPassword: Joi.valid(Joi.ref("newPassword")).required(),
  otp: Joi.number(),
});

export const recoveryEmailUsersSchema = Joi.object({
  recoveryEmail: Joi.string().email().required(),
});
