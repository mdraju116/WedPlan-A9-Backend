import { Router } from "express";
import { verifyToken } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { createServiceController,getServices,getService,
    updateServiceController,deleteServiceController,
 } from "./service.controller.js";


const router = Router();

router.post( "/", verifyToken,authorize("Vendor"), createServiceController);
router.get("/", getServices);
router.get("/:id", getService);
router.patch("/:id",verifyToken,authorize("Vendor"),updateServiceController);
router.delete( "/:id", verifyToken,authorize("Vendor"), deleteServiceController);


export default router;