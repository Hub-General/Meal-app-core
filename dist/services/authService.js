"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const argon2_1 = __importDefault(require("argon2"));
const client_1 = __importDefault(require("../prisma/client"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateAccessToken_1 = require("../utility/generateAccessToken");
const emailService_1 = require("./emailService");
exports.authService = {
    register: async (registerRequest) => {
        const existing = await client_1.default.users.findFirst({ where: { referenceEmail: registerRequest.email } });
        if (existing && existing.isActivated) {
            throw new Error("User with this email is already activated");
        }
        else if (!existing) {
            throw new Error("Email invalid");
        }
        const onBoardingToken = await client_1.default.userTokens.findFirst({ where: { userId: existing.id, type: "USER_ONBOARDING" } });
        if (!onBoardingToken || onBoardingToken.usedAt) {
            throw new Error("Unused Token not found");
        }
        else if (onBoardingToken.expiresAt < new Date()) {
            throw new Error("Token has expired. Request a new one");
        }
        const validToken = await argon2_1.default.verify(onBoardingToken.token, registerRequest.token);
        if (!validToken) {
            throw new Error("Invalid user token");
        }
        const passwordHash = await argon2_1.default.hash(registerRequest.password);
        await client_1.default.$transaction(async (tx) => {
            await tx.users.update({
                where: { id: existing.id },
                data: {
                    passwordHash: passwordHash,
                    isActivated: true,
                    status: "ACTIVE"
                },
                include: {
                    role: true
                }
            });
            await tx.userTokens.update({ where: { id: onBoardingToken.id }, data: {
                    usedAt: new Date()
                } });
        });
        return { message: "Account activated!" };
    },
    onBoarding: async (email) => {
        const existing = await client_1.default.users.findFirst({ where: { referenceEmail: email } });
        if (existing && existing.isActivated) {
            throw new Error("User with this email is already activated");
        }
        else if (!existing) {
            throw new Error("Email invalid");
        }
        const token = crypto_1.default.randomBytes(4).toString("hex").toUpperCase();
        const tokenHash = await argon2_1.default.hash(token);
        await client_1.default.userTokens.upsert({
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
        emailService_1.mailService.sendOnboardingEmail(email, existing.name, token);
        return ({ message: "Succesfully onboarded. Please wait for Email" });
    },
    generateforgetPasswordToken: async ({ email }) => {
        const user = await client_1.default.users.findFirst({ where: { referenceEmail: email } });
        if (!user) {
            throw new Error("Invalid Email");
        }
        if (user.passwordHash == null || user.status !== "ACTIVE") {
            throw new Error("User Inactive");
        }
        const token = crypto_1.default.randomBytes(4).toString("hex").toUpperCase();
        const tokenHash = await argon2_1.default.hash(token);
        await client_1.default.userTokens.upsert({
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
        emailService_1.mailService.sendPasswordResetMail(email, user.name, token);
        return ({ message: "Succesfully sent Reset Password Mail to" });
    },
    resetPassword: async (resetPasswordRequest) => {
        const existing = await client_1.default.users.findFirst({ where: { referenceEmail: resetPasswordRequest.email } });
        if (!existing) {
            throw new Error("Invalid email");
        }
        const resetToken = await client_1.default.userTokens.findFirst({ where: { userId: existing.id, type: "PASSWORD_RESET" } });
        if (existing.status !== "ACTIVE") {
            throw new Error("User is inactive");
        }
        if (!existing.isActivated || existing.passwordHash == null) {
            throw new Error("User Inactive");
        }
        if (!resetToken || resetToken.token == null) {
            throw new Error("Invalid Token");
        }
        const isValid = exports.authService.verifyResetPasswordOTP({ email: resetPasswordRequest.email, token: resetPasswordRequest.token });
        if (!isValid) {
            throw new Error("Invalid Token");
        }
        const passwordHash = await argon2_1.default.hash(resetPasswordRequest.password);
        await client_1.default.$transaction(async (tx) => {
            await tx.users.update({
                where: { id: existing.id },
                data: {
                    passwordHash: passwordHash,
                },
            });
            await tx.userTokens.update({ where: { id: resetToken.id }, data: {
                    usedAt: new Date()
                } });
        });
        return ({ message: "Succesfully reset password" });
    },
    login: async (loginRequest) => {
        const user = await client_1.default.users.findFirst({ where: { OR: [{ email: loginRequest.email }, { referenceEmail: loginRequest.email }] }, include: { role: { select: { id: true, name: true } } } });
        if (!user) {
            throw new Error("Invalid email or password");
        }
        if (user.status !== "ACTIVE") {
            throw new Error("Access Denied. User is not active");
        }
        if (!user.isActivated || user.passwordHash == null) {
            throw new Error("User has not been activated");
        }
        const isValid = await argon2_1.default.verify(user.passwordHash, loginRequest.password);
        if (!isValid) {
            throw new Error("Invalid email or password");
        }
        const accessToken = (0, generateAccessToken_1.generateAccessToken)(user.id, user.role);
        const refreshToken = (0, generateAccessToken_1.generateRefreshToken)(user.id);
        await client_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        const availability = await client_1.default.userAvailability.findFirst({ where: { userId: user.id } });
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                roleId: user.roleId,
                roleName: user.role.name,
            },
            availability: {
                startDate: availability?.startDate,
                endDate: availability?.endDate
            },
            accessToken,
            refreshToken
        };
    },
    logout: async (refreshToken) => {
        return await client_1.default.refreshToken.deleteMany({ where: { token: refreshToken } });
    },
    refreshToken: async (refreshToken) => {
        //Check if Exists
        const existing = await client_1.default.refreshToken.findUnique({ where: { token: refreshToken }, include: { user: { include: { role: true } } } });
        if (!existing) {
            throw new Error("Invalid Refresh token");
        }
        //Check if Expired
        if (existing.expiresAt < new Date) {
            await client_1.default.refreshToken.delete({ where: { id: existing.id } });
            throw new Error("Refresh Token Expired");
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        if (decoded.userId !== existing.user.id) {
            throw new Error("Invalid Refresh Token");
        }
        //All checks passed, generate a new token
        const newAccessToken = (0, generateAccessToken_1.generateAccessToken)(existing.userId, existing.user.role);
        return {
            accessToken: newAccessToken
        };
    },
    verifyResetPasswordOTP: async ({ email, token }) => {
        const user = await client_1.default.users.findFirst({ where: { referenceEmail: email } });
        if (!user) {
            throw new Error("Invalid User");
        }
        const passwordToken = await client_1.default.userTokens.findFirst({ where: { userId: user.id, type: "PASSWORD_RESET" } });
        if (!passwordToken) {
            throw new Error("Invalid OTP");
        }
        if (passwordToken?.expiresAt < new Date) {
            throw new Error("OTP Expired, request a new one");
        }
        return await argon2_1.default.verify(passwordToken.token, token);
    }
};
//# sourceMappingURL=authService.js.map