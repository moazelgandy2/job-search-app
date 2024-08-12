import { Router } from "express";
import {
  addJob,
  applyToJob,
  deleteJob,
  getCompanyJobs,
  getFilteredJobs,
  getJobsInfo,
  updateJob,
} from "./jobs.controller";
import multer from "multer";
import { checkAuth, validateRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createJobValidation, updateJobValidation } from "./jobs.validation";

const upload = multer({ storage: multer.memoryStorage() });

const jobsRouter = Router();

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
export default jobsRouter;
