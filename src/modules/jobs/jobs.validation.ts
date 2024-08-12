import Joi from "joi";

export const createJobValidation = Joi.object({
  title: Joi.string().required(),
  location: Joi.string().valid("remote", "onsite", "hybrid").required(),
  workingTime: Joi.string().valid("full-time", "part-time").required(),
  level: Joi.string()
    .valid("Junior", "Mid-Level", "Senior", "Team-Lead", "CTO")
    .required(),
  description: Joi.string().required(),
  techSkills: Joi.array().items(Joi.string()).required(),
  softSkills: Joi.array().items(Joi.string()).required(),
});

export const updateJobValidation = Joi.object({
  title: Joi.string(),
  location: Joi.string().valid("remote", "onsite", "hybrid"),
  workingTime: Joi.string().valid("full-time", "part-time"),
  level: Joi.string().valid(
    "Junior",
    "Mid-Level",
    "Senior",
    "Team-Lead",
    "CTO"
  ),
  description: Joi.string(),
  techSkills: Joi.array().items(Joi.string()),
  softSkills: Joi.array().items(Joi.string()),
});
