import { Request, Response } from "express";
import {authService} from "../services/authService";
import { digiHRService } from "../services/digiHRService";
import { ChangePasswordSchema, GeneratePasswordTokenSchema, LoginRequestSchema, LogoutRequestSchema, OnboardingBatchRequestSchema, OnboardingRequestSchema, RefreshRequestSchema, RegisterRequestSchema, ResetPasswordSchema, VerifyOTPSchema } from "../schema/auth";

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
            res.status(401).json({message: "Invalid credentials"});
        }
    },
    overrideOnboardingTokenController: async (req: Request, res: Response) => {
        try {
           const parsed = OnboardingRequestSchema.safeParse(req.body)
           if(!parsed.success){
            return res.status(400).json({ message: "Invalid onboarding data", errors: parsed.error.flatten() });
           }
           const result = await authService.overrideOnboardingToken(parsed.data.email);
           return res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Failed to override onboarding token",
            });
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
    onBoardingBroadcastController: async (req: Request, res: Response)=>{

    },

    onBoardingBatchController: async(req: Request, res: Response)=>{
    try{
        const parsed = OnboardingBatchRequestSchema.safeParse(req.body);
        if(!parsed.success){
            return res.status(400).json({ message: "Invalid batch onboarding data", errors: parsed.error.flatten() });
        }
        const result = await authService.onBoardingBatch(parsed.data.emails);
        res.status(200).json(result)
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
                return res.status(400).json({message: 'Refresh token required'})
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
                return res.status(401).json({message: "Refresh token is required"})
            }
            const newAccessToken = await authService.refreshToken(parsed.data.refreshToken);
            return res.status(200).json(newAccessToken)

        }catch(error){
            res.status(400).json({
                message: "Failed to renew access token"
            })
        }
    },

    verifyPasswordResetOTPController: async(req: Request, res: Response)=>{
        try{
            const parsed = VerifyOTPSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(401).json({message: "Email and Token are required"})
            }
            await authService.verifyResetPasswordOTP(parsed.data)
            res.status(200).json({message:"OTP is valid"})
        }catch(error){
            res.status(500).json({message:"Failed to verifyOTP"})
        }
    },

    getResetPasswordTokenController: async(req:Request, res: Response)=>{
        try{
            const parsed =  GeneratePasswordTokenSchema.safeParse(req.body)
            if(!parsed.success){
                return res.status(401).json({message:"Email Required"})
            }
            await authService.generateforgetPasswordToken({email:parsed.data.email}
            )
            res.status(200).json({message: "Successfully sent mail"})    
        }catch(error){
            res.status(500).json(`${error}`)
        }
    },

    resetPasswordController: async(req:Request, res: Response)=>{
        try{
            const parsed = ResetPasswordSchema.safeParse(req.body);
            if(!parsed.success){
                return res.status(401).json({message: "Email and New Password are required"})
            }
            await authService.resetPassword(parsed.data)
            res.status(200).json({message:"Successfully reset Password"})
        }catch(error){
            res.status(500).json({message:"Failed to reset Password", error})
        }
    },
    syncUserController: async(req: Request, res: Response)=>{
        try{
            await digiHRService.syncUsersWithDatabase();
            return res.status(200).json(`Successful sync!`)
        }catch (error){
            res.status(500).json({
                message:'Failed to sync users'
            })
        }
    },
    syncAvailabilityController: async(req: Request, res: Response)=>{
        try{
            await digiHRService.updateUserAvailabilityTable(req.body);
            return res.status(200).json(`Successful Availability Sync!`)
        }catch (error){
            res.status(500).json({
                message:'Failed to sync users availability',error
            })
        }
    },
    changePasswordController: async (req: Request, res: Response) => {
        try {
            const parsed = ChangePasswordSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    message: "Invalid password payload",
                    errors: parsed.error.flatten()
                });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const result = await authService.changePassword(
                userId,
                parsed.data.currentPassword,
                parsed.data.newPassword
            );

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({
                message: error instanceof Error ? error.message : "Failed to change password"
            });
        }
    }
}