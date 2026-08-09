import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;


export interface JwtPayload {
    userId: number;
    role:{
        id: number
    };
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