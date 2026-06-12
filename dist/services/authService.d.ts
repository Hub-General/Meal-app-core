interface RegisterRequest {
    username: string;
    password: string;
    email?: string;
}
interface LoginRequest {
    username: string;
    password: string;
}
export declare const authService: {
    register: (registerRequest: RegisterRequest) => Promise<void>;
    login: (loginRequest: LoginRequest) => Promise<void>;
    logout: (userId: number) => Promise<void>;
};
export {};
//# sourceMappingURL=authService.d.ts.map