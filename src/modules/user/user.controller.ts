import type { Request, Response, NextFunction } from "express";
import { getUserProfile } from "./user.service.js";
import { updateUserProfile } from "./user.service.js";
import { getAllUsers } from "./user.service.js";
import { ObjectId } from "mongodb";
import { updateUserBlockStatus } from "./user.service.js";

export async function getProfile(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await getUserProfile(req.user!.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User profile not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
}



export async function updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { name, image, businessName } = req.body;

        const updateData = {
            ...(name !== undefined && { name }),
            ...(image !== undefined && { image }),
            ...(businessName !== undefined && { businessName }),
        };

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update",
            });
        }

        await updateUserProfile(req.user!.id, updateData);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
        });
    } catch (error) {
        next(error);
    }
}

export async function getUsers(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const users = await getAllUsers();

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: users,
        });
    } catch (error) {
        next(error);
    }
}


export async function updateUserStatus(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        if (typeof isBlocked !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isBlocked must be a boolean",
            });
        }

        const result = await updateUserBlockStatus(
            new ObjectId(id),
            isBlocked
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
        });
    } catch (error) {
        next(error);
    }
}