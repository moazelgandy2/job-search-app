import { Router } from "express";
import {
  createCompanyValidation,
  updateCompanyValidation,
} from "./company.valudation";
import {
  addCompany,
  deleteCompany,
  getCompanyApplications,
  updateCompany,
  generateSheet,
} from "./company.controller";
import { validate } from "../../middlewares/validate";
import { checkAuth, validateRole } from "../../middlewares/auth";

const companyRouter = Router();

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

export default companyRouter;
