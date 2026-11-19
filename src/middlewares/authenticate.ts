
import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const frontendURL =
    process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL_VERCEL
        : process.env.FRONTEND_URL_LOCAL;

if (!frontendURL) {
    throw new Error("Frontend URL is not defined");
}

const JWKS = createRemoteJWKSet(
    new URL(`${frontendURL}/api/auth/jwks`)
);

// Express middleware function
export async function verifyToken(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: frontendURL,
            audience: frontendURL,
        });

        if (!payload.sub) {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }

        const db = getDB();

        const user = await db.collection("user").findOne({
            // _id: payload.sub
            _id: new ObjectId(payload.sub),
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked",
            });
        }

        req.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
}
