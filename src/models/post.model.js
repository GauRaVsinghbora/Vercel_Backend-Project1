import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    twitte: { type: String, required: true,lowercase:true, trim: true },
    file_url: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Post = mongoose.model('Post', postSchema);