import express from 'express'
import { google, signin, signout, signup, verifyEmail } from '../controllers/auth.controller.js';

 const router = express.Router();

 router.post('/signup',signup)
 router.post('/verify', verifyEmail);
// router.post('/verifyotp', verifyOTP);
 router.post('/signin',signin)
 router.post("/google",google)
 router.get("/signout",signout)

 export default router;