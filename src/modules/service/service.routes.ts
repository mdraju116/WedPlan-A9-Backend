import { Router } from "express";
import { verifyToken } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { createServiceController,getServices,getService, } from "./service.controller.js";


const router = Router();

router.post( "/", verifyToken,authorize("Vendor"), createServiceController);
router.get("/", getServices);
router.get("/:id", getService);

export default router;