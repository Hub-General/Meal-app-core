import z from "zod";

export const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100)
});

export const RegisterRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    token: z.string()
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;