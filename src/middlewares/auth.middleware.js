import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers?.("authorization")?.replace('Bearer ','')
        if (!token) {
            throw new ApiError(401, 'token missing');
        }
        const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user =  await User.findById(decodedToken?.userId).select('-password -otp -otpexpiry -refreshToken');
        if(!user){
            throw new ApiError(401, 'unauthorized user, user not found');
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, 'error in token authentication');
    }
})