import mongoose from "mongoose";

export const db = () => {
  mongoose.set("strictQuery", true);
  mongoose
    .connect(process.env.MONGO_DB_URL as string)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB: ", err);
    });
};
