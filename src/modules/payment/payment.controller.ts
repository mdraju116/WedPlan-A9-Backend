
import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../../config/stripe.js";
import {
    updateUserSubscription,
    getUserIdByStripeCustomerId,
} from "./payment.service.js";

export async function handleStripeWebhook(
    req: Request,
    res: Response
) {
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
        return res.status(400).json({
            success: false,
            message: "Missing Stripe webhook signature or secret",
        });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            webhookSecret
        );
    } catch (error) {
        console.error("Stripe signature verification failed:", error);

        return res.status(400).json({
            success: false,
            message: "Invalid Stripe webhook signature",
        });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                if (
                    session.mode !== "subscription" ||
                    !session.subscription
                ) {
                    break;
                }

                const userId =
                    session.metadata?.userId ||
                    session.client_reference_id;

                if (!userId) {
                    throw new Error(
                        "User ID not found in checkout session"
                    );
                }

                const subscriptionId =
                    typeof session.subscription === "string"
                        ? session.subscription
                        : session.subscription.id;

                const subscription =
                    await stripe.subscriptions.retrieve(subscriptionId);

                await updateUserSubscription(userId, subscription);
                break;
            }

            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;

                const customerId =
                    subscription.customer.toString();

                const userId =
                    subscription.metadata?.userId ||
                    await getUserIdByStripeCustomerId(customerId);

                if (!userId) {
                    console.warn(
                        `Ignoring subscription ${subscription.id}: user not found`
                    );
                    break;
                }

                await updateUserSubscription(userId, subscription);
                break;
            }

            default:
                console.log(`Unhandled Stripe event: ${event.type}`);
        }

        return res.status(200).json({
            success: true,
            received: true,
        });
    } catch (error) {
        console.error("Stripe webhook processing failed:", error);

        return res.status(500).json({
            success: false,
            message: "Webhook processing failed",
        });
    }
}
