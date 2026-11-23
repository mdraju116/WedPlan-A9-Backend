import type { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { getDB } from "../../config/db.js";
import { stripe } from "../../config/stripe.js";
import { getTransactions, getUserIdByStripeCustomerId, recordPaidSubscriptionInvoices, syncTransactionsForKnownSubscriptions, updateTransactionStatus, updateUserSubscription } from "./payment.service.js";

export async function handleStripeWebhook(req: Request, res: Response) {
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) return res.status(400).json({ success: false, message: "Missing Stripe webhook signature or secret" });

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch {
        return res.status(400).json({ success: false, message: "Invalid Stripe webhook signature" });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                if (session.mode !== "subscription" || !session.subscription) break;
                const userId = session.metadata?.userId || session.client_reference_id;
                if (!userId) throw new Error("User ID not found in checkout session");
                const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                await updateUserSubscription(userId, subscription);
                await recordPaidSubscriptionInvoices({ userId, email: session.customer_details?.email || session.customer_email, subscriptionId });
                break;
            }
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer.toString();
                const userId = subscription.metadata?.userId || await getUserIdByStripeCustomerId(customerId);
                if (!userId) break;
                await updateUserSubscription(userId, subscription);
                await updateTransactionStatus(subscription.id, subscription.status === "active" || subscription.status === "trialing" ? "paid" : subscription.status);
                break;
            }
            default:
                break;
        }
        return res.status(200).json({ success: true, received: true });
    } catch (error) {
        console.error("Stripe webhook processing failed:", error);
        return res.status(500).json({ success: false, message: "Webhook processing failed" });
    }
}

export async function confirmCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
        const sessionId = req.body?.sessionId;
        if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
            return res.status(400).json({ success: false, message: "A valid checkout session ID is required" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.mode !== "subscription" || session.status !== "complete") {
            return res.status(409).json({ success: false, message: "Checkout is not complete" });
        }
        if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
            return res.status(402).json({ success: false, message: "Stripe has not confirmed payment for this checkout" });
        }

        const sessionUserId = session.metadata?.userId || session.client_reference_id;
        if (!sessionUserId || sessionUserId !== req.user!.id.toString()) {
            return res.status(403).json({ success: false, message: "This checkout session does not belong to the signed-in user" });
        }

        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        if (!subscriptionId) {
            return res.status(409).json({ success: false, message: "No subscription is attached to this checkout" });
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.status !== "active" && subscription.status !== "trialing") {
            return res.status(409).json({ success: false, message: `Subscription is ${subscription.status}` });
        }

        const update = await updateUserSubscription(sessionUserId, subscription);
        if (update.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "User account was not found" });
        }
        await recordPaidSubscriptionInvoices({
            userId: sessionUserId,
            email: session.customer_details?.email || session.customer_email,
            subscriptionId,
        });

        return res.status(200).json({ success: true, message: "Premium subscription activated" });
    } catch (error) {
        next(error);
    }
}

export async function refreshVendorSubscription(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.id.toString();
        const customers = await stripe.customers.list({ email: req.user!.email, limit: 10 });

        for (const customer of customers.data) {
            if ("deleted" in customer && customer.deleted) continue;
            const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 100 });
            const subscription = subscriptions.data.find((item) => item.metadata?.userId === userId);
            if (!subscription) continue;

            const result = await updateUserSubscription(userId, subscription);
            if (result.matchedCount === 0) {
                return res.status(404).json({ success: false, message: "Vendor account was not found" });
            }
            await recordPaidSubscriptionInvoices({ userId, email: req.user!.email, subscriptionId: subscription.id });
            return res.status(200).json({ success: true, message: "Active subscription refreshed" });
        }

        return res.status(404).json({ success: false, message: "No active Premium subscription was found for this vendor" });
    } catch (error) {
        next(error);
    }
}

export async function getTransactionsController(_req: Request, res: Response, next: NextFunction) {
    try {
        await syncTransactionsForKnownSubscriptions();
        const transactions = await getTransactions();
        return res.status(200).json({ success: true, message: "Transactions retrieved successfully", data: transactions });
    } catch (error) { next(error); }
}

let readOnlyBillingPortalConfigurationId: string | undefined;
let readOnlyBillingPortalConfigurationPromise: Promise<string> | undefined;

async function getReadOnlyBillingPortalConfigurationId(returnUrl: string) {
    if (readOnlyBillingPortalConfigurationId) return readOnlyBillingPortalConfigurationId;

    if (!readOnlyBillingPortalConfigurationPromise) {
        readOnlyBillingPortalConfigurationPromise = (async () => {
            const configurations = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
            const existing = configurations.data.find((configuration) => configuration.metadata?.wedplan_read_only_portal === "true");
            if (existing) return existing.id;

            const configuration = await stripe.billingPortal.configurations.create({
                name: "WedPlan subscription details",
                default_return_url: returnUrl,
                features: {
                    customer_update: { enabled: false },
                    invoice_history: { enabled: true },
                    payment_method_update: { enabled: false },
                    subscription_cancel: { enabled: false },
                    subscription_pause: { enabled: false },
                    subscription_update: { enabled: false },
                },
                metadata: { wedplan_read_only_portal: "true" },
            });
            return configuration.id;
        })();
    }

    try {
        readOnlyBillingPortalConfigurationId = await readOnlyBillingPortalConfigurationPromise;
        return readOnlyBillingPortalConfigurationId;
    } catch (error) {
        readOnlyBillingPortalConfigurationPromise = undefined;
        throw error;
    }
}

export async function createSubscriptionPortalSession(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await getDB().collection("user").findOne({ _id: new ObjectId(req.user!.id.toString()) }, { projection: { stripeCustomerId: 1 } });
        if (!user?.stripeCustomerId) return res.status(400).json({ success: false, message: "No Stripe subscription is linked to this account" });
        const returnUrl = process.env.FRONTEND_URL_VERCEL || process.env.FRONTEND_URL_LOCAL;
        if (!returnUrl) return res.status(500).json({ success: false, message: "Frontend URL is not configured" });
        const configuration = await getReadOnlyBillingPortalConfigurationId(returnUrl);
        const portal = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            configuration,
            return_url: returnUrl + (req.user!.role === "Customer" ? "/dashboard/customer/subscription" : "/dashboard/vendor/subscription"),
        });
        return res.status(200).json({ success: true, data: { url: portal.url } });
    } catch (error) { next(error); }
}
