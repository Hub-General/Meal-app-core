import { LoginRequest, RegisterRequest, ResetPasswordRequest, VerifyResetPasswordOTPSchema } from "../schema/auth";
export declare const authService: {
    register: (registerRequest: RegisterRequest) => Promise<{
        message: string;
    }>;
    onBoarding: (email: string) => Promise<{
        message: string;
    }>;
    generateforgetPasswordToken: ({ email }: {
        email: string;
    }) => Promise<{
        message: string;
    }>;
    resetPassword: (resetPasswordRequest: ResetPasswordRequest) => Promise<{
        message: string;
    }>;
    login: (loginRequest: LoginRequest) => Promise<{
        user: {
            id: number;
            email: string | null;
            name: string;
            roleId: number;
            roleName: string;
        };
        availability: {
            startDate: Date | undefined;
            endDate: Date | undefined;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    logout: (refreshToken: string) => Promise<import("../generated/prisma").Prisma.BatchPayload>;
    refreshToken: (refreshToken: string) => Promise<{
        accessToken: string;
    }>;
    verifyResetPasswordOTP: ({ email, token }: VerifyResetPasswordOTPSchema) => Promise<boolean>;
};
//# sourceMappingURL=authService.d.ts.map