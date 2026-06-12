import { Request, Response } from "express";
import {authService} from "../services/authService";
import { passwordRegex } from "../utility/passwordSchema";

export const authController = {
    loginController : async (req : Request, res : Response) => {
        try{
            if(!req.body.email.trim() || !req.body.password.trim()) {
                return res.status(400).json({ message: "Email and password are required" });
            }
            const result = await authService.login(req.body);
            res.status(200).json(result);
        }
        catch(error){
            res.status(401).json({message: 'Invalid email or password'});
        }
    },

    signUpController : async (req: Request, res: Response) => {
        try{
            if(!req.body.email.trim() || !req.body.password.trim()) {
                return res.status(400).json({ message: "Email and password are required" });
            }
            if(!passwordRegex.test(req.body.password)){
                throw new Error("Password must be at least 8 characters long and include uppercase, lowercase, number, and symbol.")
            }
            
        }catch(error){
            res.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Signup failed",
            });
        }
    },
    logOutController: async (req: Request, res: Response) => {
        try{
            if(!req.body.refreshToken){
                return res.status(400).json({message: 'Refresh token required'})
            }
            await authService.logout(req.body.refreshToken);
            return res.status(200).json({message: "Logged out successfully"});

        }catch(error){
            res.status(400).json({
                message: "Failed to Logout"
            })
        }
    },

    refreshController: async (req: Request, res: Response)=>{
        try{
            if(!req.body){
                return res.status(401).json({message: "Refresh token is required"})
            }
            const newAccessToken = await authService.refreshToken(req.body);
            return res.status(200).json(newAccessToken)

        }catch(error){
            res.status(400).json({
                message: "Failed to renew access token"
            })
        }
    }
}