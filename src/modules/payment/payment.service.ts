import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { getDB } from "../../config/db.js";
import { stripe } from "../../config/stripe.js";

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

export async function recordPaidSubscriptionInvoices(input: { userId: string; email?: string | null; subscriptionId: string }) {
    const invoices = await stripe.invoices.list({ subscription: input.subscriptionId, status: "paid", limit: 100 });
    const transactions = getDB().collection("transactions");

    for (const invoice of invoices.data) {
        const paidAt = invoice.status_transitions.paid_at ?? invoice.created;
        if (invoice.billing_reason === "subscription_create") {
            const checkoutTransaction = await transactions.findOne({
                stripeSubscriptionId: input.subscriptionId,
                stripeSessionId: { $exists: true },
                status: "paid",
            });
            if (checkoutTransaction) {
                await transactions.updateOne({ _id: checkoutTransaction._id }, { $set: { stripeInvoiceId: invoice.id } });
                continue;
            }
        }

        await transactions.updateOne(
            { _id: invoice.id },
            {
                $setOnInsert: {
                    _id: invoice.id,
                    vendorId: input.userId,
                    vendorEmail: input.email || "",
                    plan: "Premium",
                    amount: invoice.amount_paid / 100,
                    currency: invoice.currency.toUpperCase(),
                    stripeInvoiceId: invoice.id,
                    stripeSubscriptionId: input.subscriptionId,
                    status: "paid",
                    createdAt: new Date(paidAt * 1000),
                },
            },
            { upsert: true },
        );
    }

    return invoices.data.length;
}

export async function syncTransactionsForKnownSubscriptions() {
    const vendors = await getDB().collection("user")
        .find({ role: "Vendor", stripeSubscriptionId: { $type: "string" } })
        .project<{ _id: ObjectId; email?: string; stripeSubscriptionId: string }>({ _id: 1, email: 1, stripeSubscriptionId: 1 })
        .toArray();

    for (const vendor of vendors) {
        await recordPaidSubscriptionInvoices({
            userId: vendor._id.toString(),
            email: vendor.email,
            subscriptionId: vendor.stripeSubscriptionId,
        });
    }
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
