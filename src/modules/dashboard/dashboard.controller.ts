import type { Request, Response, NextFunction } from "express";
import { getCustomerDashboard } from "./dashboard.service.js";

export async function getCustomerDashboardController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const customerId = req.user!.id.toString();

        const dashboard = await getCustomerDashboard(customerId);

        res.status(200).json({
            success: true,
            message: "Customer dashboard retrieved successfully",
            data: dashboard,
        });
    } catch (error) {
        next(error);
    }
}