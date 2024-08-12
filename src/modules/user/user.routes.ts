import { Router } from "express";
import {
  deleteUser,
  getRecoveryEmailUsers,
  getUserData,
  resetPassword,
  signIn,
  signUp,
  updatePassword,
  updateUser,
} from "./user.controller";
import { CheckEmailValidity } from "../../lib/find-user";
import { validate } from "../../middlewares/validate";
import {
  recoveryEmailUsersSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  updateUserSchema,
} from "./user.validation";
import { checkAuth } from "../../middlewares/auth";

const userRouter = Router();

userRouter.post("/signup", validate(signUpSchema), CheckEmailValidity, signUp);
userRouter.post("/signin", validate(signInSchema), signIn);
userRouter.patch(
  "/:userId",
  checkAuth as any,
  validate(updateUserSchema),
  CheckEmailValidity,
  updateUser
);

userRouter.delete("/:userId", checkAuth as any, deleteUser);
userRouter.get("/info/me", checkAuth as any, getUserData);

userRouter.get("/info/:userId", checkAuth as any, getUserData);
userRouter.put(
  "/password",
  validate(updatePasswordSchema),
  checkAuth as any,
  updatePassword
);
userRouter.post("/reset-password", resetPassword);
userRouter.post(
  "/recovery-email-users",
  validate(recoveryEmailUsersSchema),
  checkAuth,
  getRecoveryEmailUsers
);
export default userRouter;
