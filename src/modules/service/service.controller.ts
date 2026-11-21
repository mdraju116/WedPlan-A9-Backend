import type { Request, Response, NextFunction } from "express";
import { createService } from "./service.service.js";
import { getAllServices } from "./service.service.js";
import { ObjectId } from "mongodb";
import { getSingleService } from "./service.service.js";
import { updateService } from "./service.service.js";
import { deleteService } from "./service.service.js";




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

export async function updateServiceController(
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

        const { title, category, price, description, image } = req.body;

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