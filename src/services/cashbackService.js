import { Op } from "sequelize";
import CashbackTransaction from "../models/CashbackTransaction.js";
import Order from "../models/Order.js";
import CashbackAllocation from "../models/CashbackAllocation.js";

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
export async function reserveCashbackForOrder({
  userId,
  order,
  requestedAmountCents,
  maximumAmountCents,
  transaction,
}) {
  if (!transaction) {
    throw new Error(
      "A reserva de VHX Cash deve ocorrer dentro de uma transação",
    );
  }

  if (!Number.isSafeInteger(requestedAmountCents) || requestedAmountCents < 0) {
    throw new Error("Valor de VHX Cash inválido");
  }

  if (!Number.isSafeInteger(maximumAmountCents) || maximumAmountCents < 0) {
    throw new Error("Limite de VHX Cash inválido");
  }

  if (requestedAmountCents === 0) {
    return {
      redeemedAmountCents: 0,
      transaction: null,
    };
  }

  if (requestedAmountCents > maximumAmountCents) {
    throw new Error(
      "O VHX Cash não pode ultrapassar o valor dos produtos após o desconto",
    );
  }

  await expireCashbackCredits({
    userId,
    transaction,
  });

  const credits = await CashbackTransaction.findAll({
    where: {
      user_id: userId,
      type: "earned",
      status: "available",
      remaining_amount: {
        [Op.gt]: 0,
      },
      [Op.or]: [
        {
          expires_at: null,
        },
        {
          expires_at: {
            [Op.gt]: new Date(),
          },
        },
      ],
    },
    order: [
      ["expires_at", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const availableCents = credits.reduce(
    (total, credit) => total + moneyToCents(credit.remaining_amount),
    0,
  );

  if (requestedAmountCents > availableCents) {
    throw new Error("Saldo de VHX Cash insuficiente");
  }

  const redemption = await CashbackTransaction.create(
    {
      user_id: userId,
      order_id: order.id,
      type: "redeemed",
      status: "pending",
      amount: centsToMoney(requestedAmountCents),
      remaining_amount: 0,
      available_at: null,
      expires_at: null,
      description: `VHX Cash reservado no pedido #${order.id}`,
    },
    {
      transaction,
    },
  );

  let amountRemainingCents = requestedAmountCents;

  for (const credit of credits) {
    if (amountRemainingCents <= 0) {
      break;
    }

    const creditRemainingCents = moneyToCents(credit.remaining_amount);

    const allocatedAmountCents = Math.min(
      creditRemainingCents,
      amountRemainingCents,
    );

    const updatedRemainingCents = creditRemainingCents - allocatedAmountCents;

    await credit.update(
      {
        remaining_amount: centsToMoney(updatedRemainingCents),
        status: updatedRemainingCents === 0 ? "completed" : "available",
      },
      {
        transaction,
      },
    );

    await CashbackAllocation.create(
      {
        redemption_transaction_id: redemption.id,
        credit_transaction_id: credit.id,
        amount: centsToMoney(allocatedAmountCents),
      },
      {
        transaction,
      },
    );

    amountRemainingCents -= allocatedAmountCents;
  }

  if (amountRemainingCents !== 0) {
    throw new Error("Não foi possível reservar todo o saldo de VHX Cash");
  }

  await order.update(
    {
      cashback_redeemed_amount: centsToMoney(requestedAmountCents),
    },
    {
      transaction,
    },
  );

  return {
    redeemedAmountCents: requestedAmountCents,
    transaction: redemption,
  };
}

export async function confirmCashbackRedemption({ order, transaction }) {
  const redemption = await CashbackTransaction.findOne({
    where: {
      order_id: order.id,
      type: "redeemed",
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!redemption) {
    return null;
  }

  if (redemption.status === "completed") {
    return redemption;
  }

  if (redemption.status !== "pending") {
    throw new Error(
      `O resgate do pedido ${order.id} não pode ser confirmado com status ${redemption.status}`,
    );
  }

  await redemption.update(
    {
      status: "completed",
      description: `VHX Cash utilizado no pedido #${order.id}`,
    },
    {
      transaction,
    },
  );

  return redemption;
}

export async function reverseCashbackRedemption({ order, transaction }) {
  const redemption = await CashbackTransaction.findOne({
    where: {
      order_id: order.id,
      type: "redeemed",
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!redemption) {
    return null;
  }

  const existingReversal = await CashbackTransaction.findOne({
    where: {
      order_id: order.id,
      type: "reversed",
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (existingReversal) {
    return existingReversal;
  }

  if (redemption.status !== "pending" && redemption.status !== "completed") {
    return null;
  }

  const allocations = await CashbackAllocation.findAll({
    where: {
      redemption_transaction_id: redemption.id,
    },
    order: [["id", "ASC"]],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  let restoredAmountCents = 0;

  for (const allocation of allocations) {
    const credit = await CashbackTransaction.findByPk(
      allocation.credit_transaction_id,
      {
        transaction,
        lock: transaction.LOCK.UPDATE,
      },
    );

    if (!credit) {
      throw new Error(
        `Crédito ${allocation.credit_transaction_id} não encontrado`,
      );
    }

    const allocationCents = moneyToCents(allocation.amount);

    const currentRemainingCents = moneyToCents(credit.remaining_amount);

    const originalAmountCents = moneyToCents(credit.amount);

    const restoredRemainingCents = currentRemainingCents + allocationCents;

    if (restoredRemainingCents > originalAmountCents) {
      throw new Error(
        `A devolução ultrapassaria o valor do crédito ${credit.id}`,
      );
    }

    await credit.update(
      {
        remaining_amount: centsToMoney(restoredRemainingCents),
        status: "available",
      },
      {
        transaction,
      },
    );

    restoredAmountCents += allocationCents;
  }

  const redemptionAmountCents = moneyToCents(redemption.amount);

  if (restoredAmountCents !== redemptionAmountCents) {
    throw new Error(
      `As alocações do resgate do pedido ${order.id} estão divergentes`,
    );
  }

  await redemption.update(
    {
      status: "cancelled",
      description: `Reserva de VHX Cash cancelada no pedido #${order.id}`,
    },
    {
      transaction,
    },
  );

  const reversal = await CashbackTransaction.create(
    {
      user_id: order.user_id,
      order_id: order.id,
      type: "reversed",
      status: "completed",
      amount: centsToMoney(restoredAmountCents),
      remaining_amount: 0,
      available_at: new Date(),
      expires_at: null,
      description: `Devolução do VHX Cash do pedido #${order.id}`,
    },
    {
      transaction,
    },
  );

  return reversal;
}
