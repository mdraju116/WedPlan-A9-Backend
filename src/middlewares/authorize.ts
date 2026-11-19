
import type { Request, Response, NextFunction } from "express";

type UserRole = "Customer" | "Vendor" | "Admin";

export function authorize(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!allowedRoles.includes(req.user.role as UserRole)) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to access this resource",
            });
        }

        next();
    };
}
