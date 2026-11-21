import { Router } from "express";
import { verifyToken } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { getCustomerDashboardController } from "./dashboard.controller.js";
import { getVendorDashboardController } from "./dashboard.controller.js";


const router = Router();

router.get(
    "/customer",
    verifyToken,
    authorize("Customer"),
    getCustomerDashboardController
);

router.get(
    "/vendor",
    verifyToken,
    authorize("Vendor"),
    getVendorDashboardController
);

export default router;