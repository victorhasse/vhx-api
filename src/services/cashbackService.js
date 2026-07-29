import { Op } from "sequelize";
import CashbackTransaction from "../models/CashbackTransaction.js";
import Order from "../models/Order.js";

export const CASHBACK_RATE = 5;
export const CASHBACK_EXPIRATION_DAYS = 30;
export const CASHBACK_MINIMUM_ORDER_AMOUNT = 100;

function moneyToCents(value) {
  const cents = Math.round(Number(value) * 100);

  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error("Valor monetário inválido");
  }

  return cents;
}

function centsToMoney(cents) {
  return (cents / 100).toFixed(2);
}

export async function expireCashbackCredits({ userId, transaction }) {
  const now = new Date();

  const expiredCredits = await CashbackTransaction.findAll({
    where: {
      user_id: userId,
      type: "earned",
      status: "available",
      remaining_amount: {
        [Op.gt]: 0,
      },
      expires_at: {
        [Op.lte]: now,
      },
    },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  for (const credit of expiredCredits) {
    const expiredAmountCents = moneyToCents(credit.remaining_amount);

    if (expiredAmountCents <= 0) {
      continue;
    }

    await credit.update(
      {
        status: "expired",
        remaining_amount: 0,
      },
      {
        transaction,
      },
    );

    await CashbackTransaction.create(
      {
        user_id: userId,
        order_id: null,
        type: "expiration",
        status: "completed",
        amount: centsToMoney(expiredAmountCents),
        remaining_amount: 0,
        available_at: now,
        expires_at: null,
        description: `Expiração do crédito VHX Cash #${credit.id}`,
      },
      {
        transaction,
      },
    );
  }

  return expiredCredits.length;
}

export async function getCashbackBalance({ userId, transaction }) {
  await expireCashbackCredits({
    userId,
    transaction,
  });

  const [credits, pendingOrders] = await Promise.all([
    CashbackTransaction.findAll({
      where: {
        user_id: userId,
        type: "earned",
        status: "available",
        remaining_amount: {
          [Op.gt]: 0,
        },
      },
      transaction,
    }),

    Order.findAll({
      where: {
        user_id: userId,
        status: {
          [Op.in]: ["confirmed", "shipped"],
        },
        cashback_earned_amount: {
          [Op.gt]: 0,
        },
      },
      attributes: ["id", "cashback_earned_amount"],
      transaction,
    }),
  ]);

  let availableCents = 0;
  let pendingCents = 0;
  let expiringSoonCents = 0;
  let expiringSoonDate = null;

  const now = new Date();
  const expiringSoonLimit = new Date(now);

  expiringSoonLimit.setDate(expiringSoonLimit.getDate() + 7);

  for (const order of pendingOrders) {
    pendingCents += moneyToCents(order.cashback_earned_amount);
  }

  for (const credit of credits) {
    const remainingCents = moneyToCents(credit.remaining_amount);

    availableCents += remainingCents;

    if (!credit.expires_at) {
      continue;
    }

    const expirationDate = new Date(credit.expires_at);

    if (expirationDate > now && expirationDate <= expiringSoonLimit) {
      expiringSoonCents += remainingCents;

      if (!expiringSoonDate || expirationDate < expiringSoonDate) {
        expiringSoonDate = expirationDate;
      }
    }
  }

  return {
    available: centsToMoney(availableCents),
    pending: centsToMoney(pendingCents),
    expiringSoon: centsToMoney(expiringSoonCents),
    expiringSoonDate: expiringSoonDate?.toISOString() ?? null,
  };
}

export async function releaseOrderCashback({ order, transaction }) {
  if (order.status !== "delivered") {
    throw new Error("O cashback só pode ser liberado após a entrega");
  }

  const earnedAmountCents = moneyToCents(order.cashback_earned_amount);

  if (earnedAmountCents <= 0) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(now);

  expiresAt.setDate(expiresAt.getDate() + CASHBACK_EXPIRATION_DAYS);

  const [cashbackCredit] = await CashbackTransaction.findOrCreate({
    where: {
      order_id: order.id,
      type: "earned",
    },
    defaults: {
      user_id: order.user_id,
      order_id: order.id,
      type: "earned",
      status: "available",
      amount: centsToMoney(earnedAmountCents),
      remaining_amount: centsToMoney(earnedAmountCents),
      available_at: now,
      expires_at: expiresAt,
      description: `VHX Cash do pedido #${order.id}`,
    },
    transaction,
  });

  return cashbackCredit;
}
