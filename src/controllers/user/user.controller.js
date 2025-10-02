import {asyncHandler} from '../../utils/asyncHandler.js';
import {ApiError} from '../../utils/apiError.js';
import {ApiResponse} from '../../utils/apiResponse.js';
import { User } from '../../models/user.model.js';
import { sendVerificationEmail } from '../../services/mailService.js';
import jwt from 'jsonwebtoken';

// Helper function to generate access token and refresh token
const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // console.log("Generated Tokens:", { accessToken, refreshToken });
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});       // validateBeforeSave: false to skip validation like required fields
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, 'Failed to generate tokens');
    }
}

// User Registration Controller
export const registerUser = asyncHandler(async (req, res) => {
    const {username, email, password} = req.body;
    // Simulate user registration logic
    if (!username || !email || !password ) {
        throw new ApiError(400, 'Missing required fields');
    }

    // check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw new ApiError(409, 'User with given email, username or phone number already exists');
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // console.log(`Generated OTP for ${phoneNumber}: ${otp}`);

    // else create user
    const user = await User.create({ 
        username, 
        email, 
        password, 
        otp,
        otpexpiry: Date.now() + 10 * 60 * 1000
    });

    // send OTP to user's email
    await sendVerificationEmail(email, otp);

    const createdUser = await User.findById(user._id).select('-password -otp -otpexpiry -refreshToken');
    if(!createdUser){
        throw new ApiError(500, 'User creation failed');
    }

    res.status(201).json(new ApiResponse(200, createdUser, 'User registered successfully'));
});

// OTP Verification Controller
export const verifyOtp = asyncHandler(async (req, res) => {
    const {email, otp} = req.body;           // email is send through the frontend (redux store/context api) only one option;
    if (!email || !otp) {
        throw new ApiError(400, 'email and OTP are required');
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    if (user.isVerified) {
        throw new ApiError(400, 'User is already verified');
    }
    if (user.otp !== otp || user.otpexpiry < Date.now()) {
        throw new ApiError(400, 'Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otp = null;
    user.otpexpiry = null;
    await user.save();

    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);
    if (!accessToken || !refreshToken) {
        throw new ApiError(500, 'Failed to generate tokens');
    }

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    };

    res.status(200).cookie('refreshToken', refreshToken, options).cookie('accessToken', accessToken, options)
    .json(new ApiResponse(200, null, 'User verified successfully'));
});

// Resend OTP Controller
export const resendOtp = asyncHandler(async (req, res) => {
    const {email} = req.body;           // email is send through the frontend (redux store/context api) only one option;
    if (!email) {
        throw new ApiError(400, 'email is required');
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    if (user.isVerified) {
        throw new ApiError(400, 'User is already verified');
    }
    // generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.email = email;
    user.otp = otp;
    user.otpexpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    // send OTP to user's email
    await sendVerificationEmail(user.email, otp);
    res.status(200).json(new ApiResponse(200, null, 'OTP resent successfully'));
});

// User Login Controller
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, 'Email and password are required');
    }
    //check if the user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        throw new ApiError(401, 'Invalid email');
    }

    //check if the password is correct
    const isPasswordValid = await existingUser.comparePassword(password);
    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid password');
    }

    // generate access token and refresh token
    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(existingUser._id);
    if (!accessToken || !refreshToken) {
        throw new ApiError(500, 'Failed to generate tokens');
    }
    
    const loggedInUser = await User.findById(existingUser._id).select('-password -otp -otpexpiry -refreshToken');

    // send cookies
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    };
    
    return res.status(200).cookie('refreshToken', refreshToken, options).cookie('accessToken', accessToken, options)
        .json(new ApiResponse(200, { user:loggedInUser, accessToken,refreshToken }, 'Login successful'));
});

// User Logout Controller
export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, 
        { 
            $set: {
                refreshToken: null
            }
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    };

    return res
    .status(200)
    .clearCookie('refreshToken', options)
    .clearCookie('accessToken', options)
    .json(new ApiResponse(200, null, 'Logout successful'));
});

// TODo: froget Password Controller
export const forgetPassword = asyncHandler(async (req, res) => {
    
});

// TODo: Reset Password Controller
export const resetPassword = asyncHandler(async (req, res) => {
    
});

// Regenerate Access Token Controller
export const regenerateAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken: oldRefreshToken } = req.cookies;
    // console.log("Refresh Token:", oldRefreshToken);
    if (!oldRefreshToken) {
        throw new ApiError(401, 'Refresh token is required');
    }
    // verify refresh token
    const decodedToken =  jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (!decodedToken) {
        throw new ApiError(401, 'Invalid refresh token');
    }
    // find user by id
    const user = await User.findById(decodedToken.userId);
    // console.log("User from Refresh Token:", user);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    // match refresh tokens
    if (user.refreshToken !== oldRefreshToken) {
        throw new ApiError(401, 'Refresh token does not match');
    }

    // generate new access token
    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id);

    // console.log("New Tokens:", { accessToken, refreshToken });
    if (!accessToken || !refreshToken) {
        throw new ApiError(500, 'Failed to generate tokens');
    }
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    };
    
    return res.status(200).cookie('refreshToken', refreshToken, options).cookie('accessToken', accessToken, options)
        .json(new ApiResponse(200, { accessToken, refreshToken }, 'Access token regenerated successfully'));
});

// Get User Controller
export const getUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(400, 'User ID is required');
    }
    const user = await User.findById(userId).select('-password -otp -otpexpiry -refreshToken');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    return res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'));
});