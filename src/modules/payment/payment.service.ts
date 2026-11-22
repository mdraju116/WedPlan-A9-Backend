import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { getDB } from "../../config/db.js";

export async function updateUserSubscription(
    userId: string,
    subscription: Stripe.Subscription
) {
    if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID in Stripe metadata");
    }

    const currentPeriodEnd =
        subscription.items.data[0]?.current_period_end;

    if (!currentPeriodEnd) {
        throw new Error("Subscription expiration date not found");
    }

    const isPremium =
        subscription.status === "active" ||
        subscription.status === "trialing";

    const db = getDB();

    return await db.collection("user").updateOne(
        { _id: new ObjectId(userId) },
        {
            $set: {
                subscriptionPlan: isPremium ? "Premium" : "Free",
                subscriptionExpiresAt: new Date(currentPeriodEnd * 1000),
                stripeCustomerId: subscription.customer.toString(),
                stripeSubscriptionId: subscription.id,
                updatedAt: new Date(),
            },
        }
    );
}


export async function getUserIdByStripeCustomerId(
    customerId: string
) {
    const db = getDB();

    const user = await db.collection("user").findOne(
        { stripeCustomerId: customerId },
        { projection: { _id: 1 } }
    );

    return user?._id?.toString() || null;
}