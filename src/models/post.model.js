import mongoose from "mongoose";
import mongopaginate from "mongoose-paginate-v2";

const postSchema = new mongoose.Schema({
    title: { type: String, required: true,lowercase:true, trim: true },
    discription: { type: String, trim: true },
    content_url: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

postSchema.plugin(mongopaginate);
export const Post = mongoose.model('Post', postSchema);