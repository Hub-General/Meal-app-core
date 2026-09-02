import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utility/verifyToken";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const [type, headerToken] = authHeader.split(" ");
      if (type === "Bearer" && headerToken) {
        token = headerToken;
      }
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        message: "Authorization required"
      });
    }

    const decoded = verifyToken(token);

    req.user = {
      id: decoded.userId,
      roleId: decoded.role.id
    }
    next();

  } catch (error) {

    return res.status(401).json({
      message: "Invalid or expired token",
      error
    })
  }
}

export const authorize = (roles: number[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (
      req.user.roleId !== undefined &&
      roles.includes(req.user.roleId)
    ) {
      return next();
    }

    return res.status(403).json({
      message: "You do not have permission to make this request",
    });
  };
};