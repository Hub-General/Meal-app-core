import { Request, Response } from "express";
import {authService} from "../services/authService";
import { digiHRService } from "../services/digiHRService";
import { LoginRequestSchema, LogoutRequestSchema, OnboardingRequestSchema, RefreshRequestSchema, RegisterRequestSchema } from "../schema/auth";

export const authController = {
    loginController : async (req : Request, res : Response) => {
        try{
            const request = LoginRequestSchema.safeParse(req.body);
            if(!request.success){
                return res.status(400).json({
                    message: `Invalid login data`,
                    errors: request.error.flatten()
                });
            }
            const user = await authService.login(request.data);
            res.status(200).json(user);
        }
        catch(error){
            res.status(401).json({message: `Failed to login`});
        }
    },

    onBoardingController : async (req: Request, res: Response) => {
        try{
            const parsed = OnboardingRequestSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({ message: "Invalid onboarding data", errors: parsed.error.flatten() });
            }
            const result = await authService.onBoarding(parsed.data.email);
            res.status(200).json({result})
        }catch(error){
            res.status(400).json({
                messages: error instanceof Error
                    ? error.message
                    : "Onboarding failed",
            });
        }
    },

    signUpController : async (req: Request, res: Response) => {
        try{
            const request = RegisterRequestSchema.safeParse(req.body);
            if(!request.success){
                return res.status(400).json({
                    message: `Invalid signup data`,
                    errors: request.error.flatten()
                });
            }
            const result = await authService.register(request.data);
            res.status(200).json({message: 'Successfully Signed Up', result})
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
            const parsed = LogoutRequestSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(400).json({message: 'Refresh token required', errors: parsed.error.flatten()})
            }
            await authService.logout(parsed.data.refreshToken);
            return res.status(200).json({message: "Logged out successfully"});

        }catch(error){
            res.status(400).json({
                message: "Failed to Logout"
            })
        }
    },

    refreshController: async (req: Request, res: Response)=>{
        try{
            const parsed = RefreshRequestSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(401).json({message: "Refresh token is required", errors: parsed.error.flatten()})
            }
            const newAccessToken = await authService.refreshToken(parsed.data.refreshToken);
            return res.status(200).json(newAccessToken)

        }catch(error){
            res.status(400).json({
                message: "Failed to renew access token"
            })
        }
    },

    syncUserController: async(req: Request, res: Response)=>{
        try{
            const syncUsers = await digiHRService.syncUsersWithDatabase();
            return res.status(200).json(`Successful sync!`)
        }catch (error){
            res.status(500).json({
                message:'Failed to sync users'
            })
        }
    }
}