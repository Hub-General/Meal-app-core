import jwt, { SignOptions } from "jsonwebtoken"

export const generateAccessToken = (
  userId: number,
  role: {
    id: number,
    name: string
  }
) => {
  return jwt.sign(
    {
      userId,
      role,
    },
    process.env.JWT_ACCESS_SECRET!,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES!,
    } as SignOptions
  );
};


export const generateRefreshToken = (
  userId: number,
  keepSignedIn: boolean = false
) => {
  return jwt.sign(
    {
      userId,
      keepSignedIn,
    },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "14d",
    } as SignOptions
  );
};