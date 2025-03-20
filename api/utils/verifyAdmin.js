import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

export const verifyAdmin = (req, res,next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return console.log(errorHandler(401, 'Not authenticated!'));

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return console.log(errorHandler(403, 'Token is not valid!'));
        if (!user.isAdmin) return adminRoute(errorHandler(403, 'Only admin can perform this action!'));
        
        req.user = user;
        next();
    });
};