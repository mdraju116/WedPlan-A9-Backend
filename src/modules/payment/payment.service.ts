import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { getDB } from "../../config/db.js";

export async function updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
    if (!ObjectId.isValid(userId)) throw new Error("Invalid user ID in Stripe metadata");
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
    if (!currentPeriodEnd) throw new Error("Subscription expiration date not found");
    const isPremium = subscription.status === "active" || subscription.status === "trialing";
    return await getDB().collection("user").updateOne(
        { _id: new ObjectId(userId) },
        { $set: { subscriptionPlan: isPremium ? "Premium" : "Free", subscriptionExpiresAt: new Date(currentPeriodEnd * 1000), stripeCustomerId: subscription.customer.toString(), stripeSubscriptionId: subscription.id, updatedAt: new Date() } },
    );
}

export async function recordPremiumTransaction(input: { userId: string; email?: string | null; session: Stripe.Checkout.Session; subscriptionId: string; status: string }) {
    const amountTotal = input.session.amount_total ?? 0;
    return await getDB().collection("transactions").updateOne(
        { stripeSessionId: input.session.id },
        { $setOnInsert: {
            vendorId: input.userId,
            vendorEmail: input.email || "",
            plan: "Premium",
            amount: amountTotal / 100,
            currency: (input.session.currency || "usd").toUpperCase(),
            stripeSessionId: input.session.id,
            stripeSubscriptionId: input.subscriptionId,
            status: input.status,
            createdAt: new Date(),
        } },
        { upsert: true },
    );
}

export async function updateTransactionStatus(subscriptionId: string, status: string) {
    return await getDB().collection("transactions").updateMany(
        { stripeSubscriptionId: subscriptionId },
        { $set: { status, updatedAt: new Date() } },
    );
}

export async function getTransactions() {
    return await getDB().collection("transactions").find({}).sort({ createdAt: -1 }).toArray();
}

export async function getUserIdByStripeCustomerId(customerId: string) {
    const user = await getDB().collection("user").findOne({ stripeCustomerId: customerId }, { projection: { _id: 1 } });
    return user?._id?.toString() || null;
}
