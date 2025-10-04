import express from 'express';
import cookieParser from 'cookie-parser';
import { ApiError } from './utils/apiError.js';
import cors from 'cors';
const app = express();

// Using middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static('public'));
app.use(cookieParser());

// importing and using routes
import userRoutes from './routes/user/user.routes.js';
app.use('/api/v1/users', userRoutes);
import postRoutes from './routes/post/post.routes.js';
app.use('/api/v1/posts', postRoutes);

app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
            data: err.data,
        });
    }

    // fallback for unexpected errors
    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});
// http://localhost:8080/api/v1/users/register
export default app;