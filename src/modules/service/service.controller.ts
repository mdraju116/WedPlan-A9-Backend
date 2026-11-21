import type { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import {
    createService,
    getAllServices,
    getAllServicesForAdmin,
    getSingleService,
    updateService,
    deleteService,
    updateServiceStatus,
    getMyServicesForVendor,
} from "./service.service.js";

// Create Service
export async function createServiceController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { title, category, price, description, image } = req.body;

        if (!title || !category || !price || !description || !image) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const service = await createService({
            title,
            category,
            price: Number(price),
            description,
            image,
            vendorId: req.user!.id.toString(),
            vendorName: req.user!.name,
        });

        res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: service,
        });
    } catch (error) {
        next(error);
    }
}

// Get All Active Services (Public)
export async function getServices(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const services = await getAllServices();

        res.status(200).json({
            success: true,
            message: "Services retrieved successfully",
            data: services,
        });
    } catch (error) {
        next(error);
    }
}

// Get All Services (Admin)
export async function getAllServicesAdmin(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const services = await getAllServicesForAdmin();

        res.status(200).json({
            success: true,
            message: "All services retrieved successfully",
            data: services,
        });
    } catch (error) {
        next(error);
    }
}

// Get Own Services (Vendor)
export async function getMyServices(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const services = await getMyServicesForVendor(
            req.user!.id.toString()
        );

        res.status(200).json({
            success: true,
            message: "Vendor services retrieved successfully",
            data: services,
        });
    } catch (error) {
        next(error);
    }
}

// Get Single Active Service
export async function getService(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const id = req.params.id;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID",
            });
        }

        const service = await getSingleService(new ObjectId(id));

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Service retrieved successfully",
            data: service,
        });
    } catch (error) {
        next(error);
    }
}

// Update Own Service
export async function updateServiceController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const id = req.params.id;
        const { title, category, price, description, image } = req.body;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID",
            });
        }

        const updateData = {
            ...(title !== undefined && { title }),
            ...(category !== undefined && { category }),
            ...(price !== undefined && { price: Number(price) }),
            ...(description !== undefined && { description }),
            ...(image !== undefined && { image }),
        };

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No fields provided for update",
            });
        }

        const result = await updateService(
            new ObjectId(id),
            req.user!.id.toString(),
            updateData
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found or you don't own this service",
            });
        }

        res.status(200).json({
            success: true,
            message: "Service updated successfully",
        });
    } catch (error) {
        next(error);
    }
}

// Delete Own Service
export async function deleteServiceController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const id = req.params.id;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID",
            });
        }

        const result = await deleteService(
            new ObjectId(id),
            req.user!.id.toString()
        );

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found or you don't own this service",
            });
        }

        res.status(200).json({
            success: true,
            message: "Service deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}

// Admin Update Service Status
export async function updateServiceStatusController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const id = req.params.id;
        const { status } = req.body;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid service ID",
            });
        }

        if (status !== "Active" && status !== "Inactive") {
            return res.status(400).json({
                success: false,
                message: "Status must be Active or Inactive",
            });
        }

        const result = await updateServiceStatus(
            new ObjectId(id),
            status
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        res.status(200).json({
            success: true,
            message: `Service status updated to ${status}`,
        });
    } catch (error) {
        next(error);
    }
}