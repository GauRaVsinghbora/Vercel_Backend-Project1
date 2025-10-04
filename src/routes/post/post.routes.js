import {Router} from 'express';
import { createPost } from '../../controllers/post/post.controllers.js';
import {verifyJWT} from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/multer.middleware.js';


const router = Router();
router.route('/create-post').post(
    verifyJWT,
    upload.fields([
        { name: 'content', maxCount: 5 },
    ]),
    createPost);

export default router;