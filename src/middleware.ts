// write a middleware to validate the user
// middleware is just a simple function
// what we do each request have a token in the header which we need to validate
import jwt, { JwtPayload } from "jsonwebtoken"
import { NextFunction, Request, Response } from "express";
import { jwt_password } from "./config";

// middleware have a paritcular signature -> req,res,next
export const userMiddleware = (req:Request,res:Response,next:NextFunction) => {
    // how to extract the header 
    const authHeader = req.headers["authorization"] // will check what is wrong
    console.log(authHeader,' authheader')
    if(!authHeader) res.status(401).json({msg:"Authorization header missing"})
    const decoded = jwt.verify(authHeader as string,jwt_password)

    if(decoded){
        if(typeof decoded === 'string'){
            res.status(403).json({
                msg: 'You are not logged in'
            })
            return;
        }
        console.log(decoded,' --------------decoded')
        req.userId = (decoded as JwtPayload).id
        console.log(req.userId,'-------req.userid')
        next()
    }else{
        res.status(403).json({msg: "You are not logged in"})
    }

    
}