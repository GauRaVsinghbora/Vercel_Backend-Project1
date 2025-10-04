import {Router} from 'express';
import {registerUser,verifyOtp,resendOtp, loginUser,logoutUser, regenerateAccessToken,getUser} from '../../controllers/user/user.controllers.js';
import {verifyJWT} from '../../middlewares/auth.middleware.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/register/verify-otp').post(verifyOtp);
router.route('/register/resend-otp').post(resendOtp);

router.route('/login').post(loginUser); 
router.route('/logout').post( verifyJWT, logoutUser );

router.route('/regenerate-access-token').post( regenerateAccessToken );
router.route('/get-user').get( verifyJWT, getUser );

export default router;