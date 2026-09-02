import z from "zod";

export const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    keepSignedIn: z.boolean().optional().default(false)
});

export const RegisterRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    token: z.string()
});

export const ResetPasswordSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    token: z.string()
})
export const OnboardingRequestSchema = z.object({
    email: z.string().trim().email()
});

export const OnboardingBatchRequestSchema = z.object({
    emails: z.array(
        z.string().trim().email()
    )
})

export const VerifyOTPSchema = z.object({
    email: z.email(),
    token: z.string()
})

export const GeneratePasswordTokenSchema = z.object({
    email: z.string().trim()
})
export const LogoutRequestSchema = z.object({
    refreshToken: z.string().min(1).optional()
});

export const RefreshRequestSchema = z.object({
    refreshToken: z.string().min(1).optional()
});

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters").max(100)
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type OnboardingRequest = z.infer<typeof OnboardingRequestSchema>;
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type VerifyResetPasswordOTPSchema = z.infer<typeof VerifyOTPSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;