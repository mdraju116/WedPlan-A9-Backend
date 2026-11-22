import { Router } from "express";
import { verifyToken } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { createServiceController, deleteAdminServiceController, deleteServiceController, getAllServicesAdmin, getMyServices, getService, getServices, updateServiceController, updateServiceStatusController } from "./service.controller.js";

const router = Router();
router.post("/", verifyToken, authorize("Vendor"), createServiceController);
router.get("/", getServices);
router.get("/admin/all", verifyToken, authorize("Admin"), getAllServicesAdmin);
router.delete("/admin/:id", verifyToken, authorize("Admin"), deleteAdminServiceController);
router.get("/my-services", verifyToken, authorize("Vendor"), getMyServices);
router.get("/:id", getService);
router.patch("/:id", verifyToken, authorize("Vendor"), updateServiceController);
router.delete("/:id", verifyToken, authorize("Vendor"), deleteServiceController);
router.patch("/:id/status", verifyToken, authorize("Admin"), updateServiceStatusController);

export default router;
