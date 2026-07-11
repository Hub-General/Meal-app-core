import argon2 from "argon2";
import prisma from "../prisma/client";
import crypto from "crypto"
import jwt from "jsonwebtoken"
import { generateAccessToken, generateRefreshToken } from "../utility/generateAccessToken";
import { mailService } from "./emailService";
import { LoginRequest, RegisterRequest } from "../schema/auth";

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

    login: async (loginRequest: LoginRequest) => {
        const user = await prisma.users.findFirst({ where: { OR : [{email: loginRequest.email}, {referenceEmail: loginRequest.email}]}, include:{role:{select:{id: true, name: true}}}})
        
        if(!user) {
            throw new Error("Invalid email or password");
        }
        
        if(user.status !== "ACTIVE"){
            throw new Error("Access Denied. User is not active");
        }

        if(!user.isActivated || user.passwordHash == null){
            throw new Error("User has not been activated");
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

    }
}