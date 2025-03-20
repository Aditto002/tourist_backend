import User from "../models/usermodel.js"
import bcryptjs from 'bcryptjs';
import { errorHandler } from "../utils/error.js";
import  Jwt from "jsonwebtoken";
import { json } from "express";
import nodemailer from 'nodemailer';
// import { sendemail } from "../utils/sendEmail.js";
import crypto from 'crypto';
import {SendEmailUtils} from '../utils/sendEmail.js'
import OTPModel from '../models/OTPModel.js'
import otpGenerator from "otp-generator";


export const signup = async (req, res, next) => {
    console.log("this is enter in the controller")
    const { username, email, password } = req.body;
    try {
        const hashpassword = bcryptjs.hashSync(password, 10);
        console.log(hashpassword)

        let existUser = await User.findOne({ email: email })
        if (existUser) {
            return res.status(200).json({
                status: "success",
                message: "user already exists",
                success: "false"
            })
        }
        const newUser = await User.create({
            email: email,
            password: hashpassword,
            username: username,
            isVerified: false
        })
     
        const verificationToken = Jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
      
       const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

       

      const OTPCode = otpGenerator.generate(4, {
        digits: true,
        alphabets: false,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
    
      const userCount = await User.aggregate([
        { $match: { email: email } },
        { $count: "total" },
      ]);
    
      if (userCount.length > 0) {
        // Insert OTP into the database
        await OTPModel.create({ email: email, otp: OTPCode });
    
        // Send email with OTP
        const emailMessage = `Your Verification Pin Code is: ${OTPCode}`;
        const emailSubject = "Xplore Connect";
        const emailSend = await SendEmailUtils(email, emailMessage, emailSubject);
    
        newUser.password = undefined;
    
        return res.status(201).json({
          status: true,
          message: "Check Your Mail For Verification OTP",
          data: newUser,
        });
      } else {
        return res.status(400).json({ message: "User not found" });
      }
    }
    catch (err) {
        next(err)
        console.log(err.message)
    }
};


////verifyEmail

export const verifyEmail = async (req, res, next) => {
  const { email,otp } = req.body;

  try {
      // Find the user by email
      const user = await User.findOne({email});

      if (!user) {
          return res.status(400).json({ message: "User not found" });
      }

      if (user.isVerified) {
          return res.status(400).json({ message: "User already verified" });
      }

      const OTPStatus = 0; 
      const OTPCount = await OTPModel.countDocuments({
        email,
        otp,
        status: OTPStatus,
      });
    
      if (OTPCount === 0) {
        return res.status(400).json({ message: "invalid OTP" });
      }
    
      
      await OTPModel.updateOne({ email, otp, status: OTPStatus }, { status: 1 });
    
      user.isVerified = true;
      user.save();
      /////////////////////////////////////////////////////
      const token = Jwt.sign({id:user._id},process.env.JWT_SECRET);
        const expiryDate = new Date(Date.now()+3600000)

      res.status(200).json({ message: "Email verified successfully!", data:{
        token: token,
        user: user
    } });
  } catch (err) {
      res.status(400).json({ message: "Invalid or expired token" });
      console.log(err.message);
  }
};


/// Sign in 

// export const signup = async (req, res, next) => {
//   const { username, email, password } = req.body;
//   try {
//       const hashpassword = bcryptjs.hashSync(password, 10);

//       const existUser = await User.findOne({ email });
//       if (existUser) {
//           return res.status(200).json({
//               status: "success",
//               message: "User already exists",
//               success: "false"
//           });
//       }

//       const newUser = await User.create({
//           email,
//           password: hashpassword,
//           username,
//           isVerified: false  // Add isVerified field
//       });

//       // Create a verification token
//       const verificationToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

//       // Send verification email
//       const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
//       const mailOptions = {
//           from: process.env.EMAIL_USER,
//           to: email,
//           subject: 'Email Verification',
//           html: `<p>Hello ${username},</p>
//                  <p>Please verify your email by clicking the link below:</p>
//                  <a href="${verificationUrl}">Verify Email</a>`
//       };

//       await transporter.sendMail(mailOptions);

//       res.status(200).json({ message: "User created successfully, verification email sent." });
//   } catch (err) {
//       next(err);
//       console.log(err.message);
//   }
// };

export const signin =async(req, res,next)=>{
      const {email, password} = req.body;
      try{
        const vaildUser = await User.findOne({email});
         if(!vaildUser) return next(errorHandler(404,'User not found'))
         const vaildpassword = bcryptjs.compareSync(password,vaildUser.password);
        if(!vaildpassword)return next(errorHandler(401,'Password not match'))
         
        const token = Jwt.sign({id:vaildUser._id},process.env.JWT_SECRET);
        const expiryDate = new Date(Date.now()+3600000)
        // res.cookie('access_token',token,{httpOnly:true, expires:expiryDate}).status(200).json(rest)
        return res.status(200).json({
            status: "success",
            data:{
                token: token,
                user: vaildUser
            }
        })

      }
      catch(err){
            next(err)
      }
}



// export const google = async(req, res, next)=>{
//     try{
//         const user = await User.findOne({email: req.body.email})
//         if(user){
//             const token = Jwt.sign({id: user._id}, process.env.JWT_SECRET);
//             const {password: hashpassword, ...rest} = user._doc;
//             const expiryDate = new Date(Date.now() + 3600000);
//             res.cookie('access_token',token,{token:token,httpOnly:true,expires:expiryDate}).status(200).json(rest);
//         }
//         else{
//             const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
//             const hashpassword = bcryptjs.hashSync(generatedPassword,10);

//             const newUser = await User.create({
//                 username : req.body.name,
//                 email: req.body.email,
//                 password: hashpassword,
//                 profilePicture: req.body.photo
//             })
//             const token = Jwt.sign({id: newUser._id}, process.env.JWT_SECRET);
//             const {password: hashpassword2, ...rest} = newUser._doc;
//             const expiryDate = new Date(Date.now() + 3600000);
//             res.cookie('access_token',token,{token:token,httpOnly:true,expires:expiryDate}).status(200).json(rest);
//         }
//     }
//     catch(error){
//         next(error)
//     }
// }





////////////////////////////////////

// export const signin = async (req, res, next) => {
//   const { email, password } = req.body;
//   try {
//       const validUser = await User.findOne({ email });
//       if (!validUser) return next(errorHandler(404, 'User not found'));

//       if (!validUser.isVerified) {
//           return res.status(403).json({ message: "Please verify your email first." });
//       }

//       const validPassword = bcryptjs.compareSync(password, validUser.password);
//       if (!validPassword) return next(errorHandler(401, 'Password not match'));

//       const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);

//       return res.status(200).json({
//           status: "success",
//           data: {
//               token: token,
//               user: validUser
//           }
//       });
//   } catch (err) {
//       next(err);
//   }
// };
//////////



export const google = async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        const token = Jwt.sign({id:user._id},process.env.JWT_SECRET);
        const expiryDate = new Date(Date.now() + 3600000);
        res
          .cookie('access_token', token, {
            token: token,
            httpOnly: true,
            expires: expiryDate,
          })
          .status(200)
          .json({
            token: token,
            status: "success",
            message: "User logged in",
            data: user,
          });
      } else {
        const generatedPassword =
          Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const hashpassword = bcryptjs.hashSync(generatedPassword, 10);
  
        const newUser = await User.create({
          username: req.body.name,
          email: req.body.email,
          password: hashpassword,
          profilePicture: req.body.photo,
        });
  
        const token = Jwt.sign({id:newUser._id},process.env.JWT_SECRET);
        const expiryDate = new Date(Date.now() + 3600000);
        res
          .cookie('access_token', token, {
            token: token,
            httpOnly: true,
            expires: expiryDate,
          })
          .status(200)
          .json({
            token: token,
            status: "success",
            message: "User created and logged in",
            data: newUser,
          });
      }
    } catch (error) {
      next(error);
    }
  };
  


export const signout = (req,res) =>{
    res.clearCookie('access_token').status(200).json("SignOut successfully")
}