import express from "express";
import "dotenv/config";
import { db } from "../db/connect";
import { AppError } from "./lib/utils/app-error";

import userRouter from "./modules/user/user.routes";
import companyRouter from "./modules/company/company.routes";
import jobsRouter from "./modules/jobs/jobs.routes";

const app = express();
const port = 8080;

app.use(express.json());

db();

app.use("/users", userRouter);
app.use("/company", companyRouter);
app.use("/jobs", jobsRouter);

app.use("*", (req, res, next) => {
  next(new AppError(`Route not found ${req.originalUrl}`, 404));
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(err.statusCode).json({ error: err.message });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
