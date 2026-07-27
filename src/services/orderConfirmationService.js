import sequelize from "../database/connection.js";
import CouponRedemption from "../models/CouponRedemption.js";
import Order from "../models/Order.js";

export async function confirmPaidOrder(paymentIntent) {
  return sequelize.transaction(async (transaction) => {
    const order = await Order.findOne({
      where: {
        payment_intent_id: paymentIntent.id,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      console.warn(
        `Pedido não encontrado para o PaymentIntent ${paymentIntent.id}`,
      );

      return null;
    }

    const expectedAmount = Math.round(
      Number(order.total) * 100,
    );

    if (
      !Number.isSafeInteger(expectedAmount) ||
      paymentIntent.amount_received !== expectedAmount
    ) {
      throw new Error(
        `Valor divergente no pedido ${order.id}`,
      );
    }

    if (
      order.status !== "pending" &&
      order.status !== "confirmed"
    ) {
      console.warn(
        `Pedido ${order.id} não pode ser confirmado com status ${order.status}`,
      );

      return order;
    }

    if (order.status === "pending") {
      await order.update(
        {
          status: "confirmed",
        },
        {
          transaction,
        },
      );
    }

    if (order.coupon_id) {
      await CouponRedemption.findOrCreate({
        where: {
          order_id: order.id,
        },
        defaults: {
          coupon_id: order.coupon_id,
          user_id: order.user_id,
          order_id: order.id,
        },
        transaction,
      });
    }

    return order;
  });
}