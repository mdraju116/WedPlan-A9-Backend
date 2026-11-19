
import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

// const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;
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

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
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

        // JWT verified successfully.
        // We'll retrieve the user from MongoDB next.

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
}
