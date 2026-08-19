import argon2, { verify } from "argon2";
import prisma from "../prisma/client";
import crypto from "crypto"
import jwt from "jsonwebtoken"
import { generateAccessToken, generateRefreshToken } from "../utility/generateAccessToken";
import { mailService } from "./emailService";
import { LoginRequest, RegisterRequest, ResetPasswordRequest, VerifyResetPasswordOTPSchema } from "../schema/auth";

export const authService = {
    register: async (registerRequest: RegisterRequest) => { 

        const existing = await prisma.users.findFirst({where: {referenceEmail: registerRequest.email}})
        
        
        if(existing && existing.isActivated){
            throw new Error("User with this email is already activated");
        }else if (!existing){
            throw new Error("Email invalid")
        }
        
        const onBoardingToken = await prisma.userTokens.findFirst({where:{userId: existing.id, type:"USER_ONBOARDING"}})
        
        if(!onBoardingToken || onBoardingToken.usedAt){
            throw new Error ("Unused Token not found")
        } else if (onBoardingToken.expiresAt < new Date()){
            throw new Error ("Token has expired. Request a new one")
        }
        const validToken = await argon2.verify(onBoardingToken.token, registerRequest.token);
        
        if(!validToken ){
            throw new Error("Invalid user token")
        }
        
        const passwordHash = await argon2.hash(registerRequest.password);
        await prisma.$transaction(async(tx)=>
        {
            await tx.users.update({
                where:{ id: existing.id },
                data: {
                    passwordHash: passwordHash,
                    isActivated: true,
                    status: "ACTIVE"
                },
                include:{
                    role: true
                }
            })
    
            await tx.userTokens.update({where:{id: onBoardingToken.id}, data:{
                usedAt: new Date()
            }})
        }
        )

        return {message:"Account activated!"};
    },
    
    onBoarding: async(email: string)=>{

        const existing = await prisma.users.findFirst({where: {referenceEmail: email}})

        if(existing && existing.isActivated){
            throw new Error("User with this email is already activated");
        }else if (!existing){
            throw new Error("Email invalid")
        }

        
        const token = crypto.randomBytes(4).toString("hex").toUpperCase();
        const tokenHash = await argon2.hash(token);

        await prisma.userTokens.upsert({
        where: {
            userId_type: {
            userId: existing.id,
            type: "USER_ONBOARDING"
            }
        },
        update: {
            token: tokenHash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            usedAt: null
        },
        create: {
            userId: existing.id,
            type: "USER_ONBOARDING",
            token: tokenHash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
        });

        mailService.sendOnboardingEmail(email,existing.name,token)
        return ({message:"Succesfully onboarded. Please wait for Email"})

    },

    onBoardingBatch: async(email: string[])=>{
            const users = await prisma.users.findMany({
                where: { referenceEmail: { in: email }, status:"ACTIVE" },
                select: { id: true, referenceEmail: true, name: true, isActivated: true },
            });


            const knownEmails = new Set(users.map(u => u.referenceEmail));
            const unknown = email.filter(e => !knownEmails.has(e));
            
            if (unknown.length) {
                throw new Error(`These email(s) are not registered or are inactive: ${unknown.join(', ')}`);
            }


            const alreadyActive = users.filter(u => u.isActivated).map(u => u.referenceEmail);
            
            if (alreadyActive.length) {
                throw new Error(`These accounts are already activated: ${alreadyActive.join(', ')}`);
            }


            const workItems = await Promise.all(
                users.map(async user => {
                    const token = crypto.randomBytes(4).toString('hex').toUpperCase();
                    const tokenHash = await argon2.hash(token);
                    return { user, token, tokenHash };
                })
            );

            await prisma.$transaction(
            workItems.map(item =>
                prisma.userTokens.upsert({
                where: {
                    userId_type: {
                    userId: item.user.id,
                    type: 'USER_ONBOARDING',
                    },
                },
                update: {
                    token: item.tokenHash,
                    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
                    usedAt: null,
                },
                create: {
                    userId: item.user.id,
                    type: 'USER_ONBOARDING',
                    token: item.tokenHash,
                    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
                },
                })
            )
            );

            workItems.forEach(item => {
            mailService.sendOnboardingEmail(
                item.user.referenceEmail,
                item.user.name,
                item.token
            );
            });
            return {
            message: 'Batch onboarding processed',
            processed: workItems.length,
            emails: workItems.map(i => i.user.referenceEmail),
            };
    },

    onBoardingBroadcast: async()=>{
        const activeUsers = await prisma.users.findMany({where:{status: "ACTIVE", isActivated: false}, select:{referenceEmail:true, name:true, id: true}})
        const workItems = await Promise.all(
                activeUsers.map(async user => {
                    const token = crypto.randomBytes(4).toString('hex').toUpperCase();
                    const tokenHash = await argon2.hash(token);
                    return { user, token, tokenHash };
                })
            );

            await prisma.$transaction(
            workItems.map(item =>
                prisma.userTokens.upsert({
                where: {
                    userId_type: {
                    userId: item.user.id,
                    type: 'USER_ONBOARDING',
                    },
                },
                update: {
                    token: item.tokenHash,
                    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
                    usedAt: null,
                },
                create: {
                    userId: item.user.id,
                    type: 'USER_ONBOARDING',
                    token: item.tokenHash,
                    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
                },
                })
            )
            );

            workItems.forEach(item => {
            mailService.sendOnboardingEmail(
                item.user.referenceEmail,
                item.user.name,
                item.token
            );
            });
            return {
            message: 'Batch onboarding processed',
            processed: workItems.length,
            emails: workItems.map(i => i.user.referenceEmail),
            };
    },

    generateforgetPasswordToken: async({email}:{email:string})=>{
        const user = await prisma.users.findFirst({where:{OR:[{referenceEmail:email, status:"ACTIVE", isActivated:true}, {email:email, status:"ACTIVE", isActivated:true}]}})

        if(!user){
            throw new Error("Invalid Email or User is Inactive")
        }
        
        const token = crypto.randomBytes(4).toString("hex").toUpperCase();
        const tokenHash = await argon2.hash(token);

        await prisma.userTokens.upsert({
        where: {
            userId_type: {
            userId: user.id,
            type: "PASSWORD_RESET"
            }
        },
        update: {
            token: tokenHash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            usedAt: null
        },
        create: {
            userId: user.id,
            type: "PASSWORD_RESET",
            token: tokenHash,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
        });
        mailService.sendPasswordResetMail(email, user.name, token)
        return ({message:"Succesfully sent Reset Password Mail to"})
    },

    resetPassword: async(resetPasswordRequest: ResetPasswordRequest)=>{
        const existing = await prisma.users.findFirst({where:{OR:[{referenceEmail:resetPasswordRequest.email, status:"ACTIVE", isActivated:true}, {email:resetPasswordRequest.email, status:"ACTIVE", isActivated:true}]}})
        
        if(!existing){
            throw new Error("Invalid email or User is Inactive")
        }
        
        const resetToken = await prisma.userTokens.findFirst({where:{userId: existing.id, type:"PASSWORD_RESET"}})

        if(!resetToken || resetToken.token == null){
            throw new Error("Invalid Token")
        }
        const isValid = authService.verifyResetPasswordOTP({email: resetPasswordRequest.email, token: resetPasswordRequest.token})

        if(!isValid){
            throw new Error("Invalid Token")
        }
        const passwordHash = await argon2.hash(resetPasswordRequest.password);
        await prisma.$transaction(async(tx)=>
        {
            await tx.users.update({
                where:{ id: existing.id },
                data: {
                    passwordHash: passwordHash,
                },
            })
    
            await tx.userTokens.update({where:{id: resetToken.id}, data:{
                usedAt: new Date()
            }})
        })
        return ({message:"Succesfully reset password"})
    },

    login: async (loginRequest: LoginRequest) => {
        const user = await prisma.users.findFirst({ where: { OR : [{email: loginRequest.email, status:"ACTIVE", isActivated:true}, {referenceEmail: loginRequest.email, status:"ACTIVE", isActivated:true}]}, include:{role:{select:{id: true, name: true}}}})
        
        if(!user) {
            throw new Error("Invalid email or password or user is inactive");
        }

        const isValid = await argon2.verify( user.passwordHash!, loginRequest.password);

        if(!isValid) {
            throw new Error("Invalid email or password");
        }
        
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken =  generateRefreshToken(user.id)
        
        await prisma.refreshToken.create({
            data: 
            {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            ),
            },
        });

        const availability = await prisma.userAvailability.findFirst({where: {userId: user.id}});
        return { 
            user:{
            id: user.id,
            email: user.email,
            name: user.name,
            roleId: user.roleId,
            roleName: user.role.name,
            }, 
            availability:{
                startDate: availability?.startDate,
                endDate: availability?.endDate
            },
            accessToken,
            refreshToken
        };
    },

    logout: async (refreshToken: string) => {
        return await prisma.refreshToken.deleteMany({where: {token: refreshToken}}) 
    },

    
    refreshToken: async(refreshToken: string)=>{

        //Check if Exists
        const existing = await prisma.refreshToken.findUnique({where:{token: refreshToken}, include:{user:{include:{role:true}}}})

        if(!existing){
            throw new Error("Invalid Refresh token")
        }

        //Check if Expired

        if(existing.expiresAt < new Date) {
            await prisma.refreshToken.delete({where:{id: existing.id}})
            throw new Error("Refresh Token Expired")
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET!
        )as {userId: number}

        if(decoded.userId !== existing.user.id){
            throw new Error("Invalid Refresh Token")
        }

        //All checks passed, generate a new token
        const newAccessToken = generateAccessToken(existing.userId, existing.user.role)

        return {
            accessToken: newAccessToken
        }

    },

    verifyResetPasswordOTP: async({email, token}:VerifyResetPasswordOTPSchema)=> {
        const user = await prisma.users.findFirst({where:{OR:[{referenceEmail: email, status:"ACTIVE", isActivated:true}, {email:email, status:"ACTIVE", isActivated:true}]}})

        if (!user){
            throw new Error("Invalid User or User is Inactive")
        }

        const passwordToken = await prisma.userTokens.findFirst({where:{userId:user.id , type:"PASSWORD_RESET"}})

        if(!passwordToken){
            throw new Error("Invalid OTP")
        }
        if (passwordToken?.expiresAt < new Date){
            throw new Error("OTP Expired, request a new one")
        }

        return await argon2.verify(passwordToken.token, token)
    }
}