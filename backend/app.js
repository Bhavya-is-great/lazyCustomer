import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

import dbConnect from "./utils/dbConnect.js";
dbConnect();

if (process.env.NODE_ENV === "development") {
    app.use(
        cors({
            origin: true,
            credentials: true,
        })
    );
} else {
    app.use(
        cors({
            origin: process.env.FRONTEND_URL,
            credentials: true,
        })
    );
}
app.use(express.json());
app.use(cookieParser());

import { getUser } from "./middlewares/auth.middleware.js";
app.use(getUser);

import userRouter from "./router/user.router.js";
app.use("/api/v1/user", userRouter);

app.get("/", (req, res) => {
    res.send("Hello, Lazy Customer!");
});

import AppError from "./utils/AppError.js";
app.all("*splat", (req, res, next) => {
    next(new AppError(404, "API endpoint not found!"));
});

import appErrorHandler from "./utils/appErrorHandler.js";
import { get } from "mongoose";
app.use(appErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
