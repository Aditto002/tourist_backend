import Jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const authorization = req.headers.authorization; // Access Authorization header specifically
    const token = authorization?.split(" ")[1];
    console.log(token);

    if (!token) return res.status(401).json('You need to Login');

    Jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json("Token is not valid");

        req.user = user;
        console.log(user)
        next();
    });
};
