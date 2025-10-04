import {asyncHandler} from '../../utils/asyncHandler.js';
import {ApiError} from '../../utils/apiError.js';
import {ApiResponse} from '../../utils/apiResponse.js';
import { User } from '../../models/user.model.js';
import { Post } from '../../models/post.model.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';

// create posts
export const createPost = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {twitte} = req.body;

    if(!userId){
        throw new ApiError(401, 'Unauthorized');
    }
    const user = await User.findById(userId).select('-password -otp -otpexpiry -refreshToken');
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // take file path from multer middleware
    let file_url = null;
    const fileLocalPath = req.files?.content[0].path;
    if(fileLocalPath){
        file_url = await uploadToCloudinary(fileLocalPath);
        if(!file_url){
            throw new ApiError(500, 'File upload failed');
        }
    }
    
    if(!twitte){
        throw new ApiError(400, 'Content is required');
    }
    const post = await Post.create(
        { 
            twitte, 
            userId,
            file_url: file_url?.url || null,
        });
    if(!post){
        throw new ApiError(500, 'Post creation failed');
    }
    const createdPost = await Post.findById(post._id).populate('userId', 'username email');
    if(!createdPost){
        throw new ApiError(500, 'Post creation failed');
    }
    res.status(201).json(new ApiResponse(201, 'Post created successfully', createdPost));
});