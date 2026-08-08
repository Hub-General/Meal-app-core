import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;


export interface JwtPayload {
    id: number;
    roleId?: number;
}


export const verifyToken = (
    token: string
): JwtPayload => {

    const decoded =
        jwt.verify(
            token,
            JWT_ACCESS_SECRET
        ) as JwtPayload;


    return decoded;
};