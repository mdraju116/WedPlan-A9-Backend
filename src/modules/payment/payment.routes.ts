import { Router } from "express";
import express from "express";
import { verifyToken } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";
import { confirmCheckoutSession, createSubscriptionPortalSession, getTransactionsController, handleStripeWebhook, refreshVendorSubscription } from "./payment.controller.js";

const router = Router();
router.post("/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
router.post("/confirm", verifyToken, authorize("Vendor", "Customer"), confirmCheckoutSession);
router.post("/refresh-subscription", verifyToken, authorize("Vendor", "Customer"), refreshVendorSubscription);
router.get("/transactions", verifyToken, authorize("Admin"), getTransactionsController);
router.post("/portal", verifyToken, authorize("Vendor", "Customer"), createSubscriptionPortalSession);

export default router;
