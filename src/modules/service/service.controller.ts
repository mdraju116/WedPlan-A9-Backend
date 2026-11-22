import type { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { createService, deleteService, deleteServiceByAdmin, getAllServices, getAllServicesForAdmin, getMyServicesForVendor, getSingleService, updateService, updateServiceStatus } from "./service.service.js";

export async function createServiceController(req: Request, res: Response, next: NextFunction) {
    try {
        const { title, category, price, description, location, images, image } = req.body;
        const serviceImages = Array.isArray(images) ? images.filter((value: unknown): value is string => typeof value === "string" && value.length > 0) : typeof image === "string" ? [image] : [];
        const parsedPrice = Number(price);
        if (typeof title !== "string" || !title.trim() || typeof category !== "string" || !category.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || typeof description !== "string" || !description.trim() || typeof location !== "string" || !location.trim() || serviceImages.length === 0) {
            return res.status(400).json({ success: false, message: "Service name, category, positive price, description, location, and at least one image are required" });
        }
        const service = await createService({ title: title.trim(), category: category.trim(), price: parsedPrice, description: description.trim(), location: location.trim(), images: serviceImages, image: serviceImages[0], vendorId: req.user!.id.toString(), vendorName: req.user!.name });
        return res.status(201).json({ success: true, message: "Service submitted for admin review", data: service });
    } catch (error) {
        if (error instanceof Error && error.message.includes("free service limit")) return res.status(403).json({ success: false, message: error.message });
        next(error);
    }
}

export async function getServices(_req: Request, res: Response, next: NextFunction) {
    try { const services = await getAllServices(); return res.status(200).json({ success: true, message: "Services retrieved successfully", data: services }); }
    catch (error) { next(error); }
}

export async function getAllServicesAdmin(_req: Request, res: Response, next: NextFunction) {
    try { const services = await getAllServicesForAdmin(); return res.status(200).json({ success: true, message: "All services retrieved successfully", data: services }); }
    catch (error) { next(error); }
}

export async function getMyServices(req: Request, res: Response, next: NextFunction) {
    try { const services = await getMyServicesForVendor(req.user!.id.toString()); return res.status(200).json({ success: true, message: "Vendor services retrieved successfully", data: services }); }
    catch (error) { next(error); }
}

export async function getService(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (typeof id !== "string" || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid service ID" });
        const service = await getSingleService(new ObjectId(id));
        if (!service) return res.status(404).json({ success: false, message: "Service not found" });
        return res.status(200).json({ success: true, message: "Service retrieved successfully", data: service });
    } catch (error) { next(error); }
}

export async function updateServiceController(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (typeof id !== "string" || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid service ID" });
        const { title, category, price, description, location, images, image } = req.body;
        const updateData = {
            ...(typeof title === "string" && { title: title.trim() }),
            ...(typeof category === "string" && { category: category.trim() }),
            ...(price !== undefined && { price: Number(price) }),
            ...(typeof description === "string" && { description: description.trim() }),
            ...(typeof location === "string" && { location: location.trim() }),
            ...(Array.isArray(images) && { images: images.filter((value: unknown): value is string => typeof value === "string" && value.length > 0) }),
            ...(typeof image === "string" && { image }),
        };
        if (!Object.keys(updateData).length) return res.status(400).json({ success: false, message: "No fields provided for update" });
        if (updateData.price !== undefined && (!Number.isFinite(updateData.price) || updateData.price <= 0)) return res.status(400).json({ success: false, message: "Price must be greater than zero" });
        if (updateData.images && updateData.images.length === 0) return res.status(400).json({ success: false, message: "At least one service image is required" });
        const result = await updateService(new ObjectId(id), req.user!.id.toString(), updateData);
        if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "Service not found or you don't own this service" });
        return res.status(200).json({ success: true, message: "Service updated and submitted for admin review" });
    } catch (error) { next(error); }
}

export async function deleteServiceController(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (typeof id !== "string" || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid service ID" });
        const result = await deleteService(new ObjectId(id), req.user!.id.toString());
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Service not found or you don't own this service" });
        return res.status(200).json({ success: true, message: "Service deleted successfully" });
    } catch (error) { next(error); }
}

export async function deleteAdminServiceController(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        if (typeof id !== "string" || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid service ID" });
        const result = await deleteServiceByAdmin(new ObjectId(id));
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: "Service not found" });
        return res.status(200).json({ success: true, message: "Service deleted successfully" });
    } catch (error) { next(error); }
}

export async function updateServiceStatusController(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id;
        const { status } = req.body;
        if (typeof id !== "string" || !ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid service ID" });
        if (!["Pending", "Active", "Inactive", "Rejected"].includes(status)) return res.status(400).json({ success: false, message: "Status must be Pending, Active, Inactive, or Rejected" });
        const result = await updateServiceStatus(new ObjectId(id), status);
        if (result.matchedCount === 0) return res.status(404).json({ success: false, message: "Service not found" });
        return res.status(200).json({ success: true, message: `Service status updated to ${status}` });
    } catch (error) {
        if (error instanceof Error && error.message.includes("free service limit")) return res.status(403).json({ success: false, message: error.message });
        next(error);
    }
}
