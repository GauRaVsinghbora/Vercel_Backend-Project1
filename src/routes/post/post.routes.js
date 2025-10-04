import {Router} from 'express';
import { createPost,getAllPosts,getPostByUserId,deletePostById } from '../../controllers/post/post.controllers.js';
import {verifyJWT} from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/multer.middleware.js';

const router = Router();

router.route('/create-post').post(
    verifyJWT,
    upload.fields([
        { name: 'content', maxCount: 5 },
    ]),
    createPost);
router.route('/get-all-posts').get(verifyJWT, getAllPosts);
router.route('/get-post-userId').get(verifyJWT, getPostByUserId);
router.route('/delete-post/:id').delete(verifyJWT,deletePostById);

export default router;