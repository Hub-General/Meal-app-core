import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utility/verifyToken";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization header missing"
      })
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Invalid authorization format"
      })
    }

    const decoded = verifyToken(token)

    req.user = {
      id: decoded.id,
      roleId: decoded.roleId
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