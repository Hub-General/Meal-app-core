import argon2 from "argon2";
import prisma from "../prisma/client";
import jwt from "jsonwebtoken"
import { generateAccessToken, generateRefreshToken } from "../utility/generateAccessToken";

interface RegisterRequest {
    name: string;
    password: string;
    email: string;
    referenceEmail: string
}

interface LoginRequest {
    email: string;
    password: string;
}

export const authService = {
    register: async (registerRequest: RegisterRequest) => { 

        const existing = await prisma.users.findUnique({where: {email : registerRequest.email}})

        if(existing){
            throw new Error("User with this email already exists");
        };

        const passwordHash = await argon2.hash(registerRequest.password);
        const user = await prisma.users.create({
            data: {
                name: registerRequest.name,
                email: registerRequest.email,
                referenceEmail: registerRequest.referenceEmail,
                passwordHash: passwordHash,
                roleId: 2,
            },
            include:{
                role: true
            }
        })
        return user;
    },

    login: async (loginRequest: LoginRequest) => {
        const user = await prisma.users.findFirst({ where: { OR : [{email: loginRequest.email}, {referenceEmail: loginRequest.email}]}, include:{role:{select:{id: true, name: true}}}})
        
        if(!user) {
            throw new Error("Invalid email or password");
        }
        
        const isValid = await argon2.verify(loginRequest.password, user.passwordHash);

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