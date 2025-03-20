import User from '../models/usermodel.js';
import {errorHandler}from '../utils/error.js'
import bcryptjs from 'bcryptjs';
import { verifyToken } from '../utils/verifyUser.js';

export const test =(req,res)=>{
    res.json({
        message:'Hello '
    })
};
//update User

export const updateUser =async(req,res,next)=>{

   const userId = req.params.id;
    try {
        if(req.body.password){
            req.body.password = bcryptjs.hashSync(req.body.password,10);
        }
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {    
                    username: req.body.username,
                    email : req.body.email,
                    password : req.body.password,
                    profilePicture: req.body.profilePicture,
                
            },{new: true}
        )
        console.log(updateUser)
        res.status(200).json({
            data: updatedUser
        });
        
    } catch (error) {
        next(error)
    }

}

// Delete User 
export const deleteUser = async (req, res, next) => {
    console.log("Request Params ID:", req.params.id);
    // console.log("Authenticated User ID:", req.user.id);

    // if (req.user.id !== req.params.id) {
    //     return next(errorHandler(401, 'You can delete only your account!'));
    // }

    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json('User has been deleted...');
    } catch (error) {
        next(error);
    }
};
