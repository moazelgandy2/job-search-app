import Joi from "joi";

export const createCompanyValidation = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  industry: Joi.string().required(),
  address: Joi.string().required(),
  employeesNumber: Joi.string().required(),
  email: Joi.string().required(),
  hr: Joi.string().hex().length(24).required(),
});

export const updateCompanyValidation = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  industry: Joi.string(),
  address: Joi.string(),
  employeesNumber: Joi.string(),
  email: Joi.string(),
  hr: Joi.string().hex().length(24),
});
