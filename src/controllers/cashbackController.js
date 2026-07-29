import { Op } from "sequelize";

import CashbackTransaction from "../models/CashbackTransaction.js";
import Order from "../models/Order.js";
import {
  expireCashbackCredits,
  getCashbackBalance,
} from "../services/cashbackService.js";

export async function getMyCashbackBalance(req, res) {
  try {
    const balance = await getCashbackBalance({
      userId: req.user.id,
    });

    return res.json(balance);
  } catch (error) {
    console.error("Erro ao consultar saldo VHX Cash:", error);

    return res.status(500).json({
      error: "Não foi possível consultar o saldo VHX Cash",
    });
  }
}

export async function getMyCashbackTransactions(req, res) {
  try {
    const requestedPage = Number(req.query.page ?? 1);
    const requestedLimit = Number(req.query.limit ?? 10);

    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isInteger(requestedLimit) &&
      requestedLimit > 0
        ? Math.min(requestedLimit, 50)
        : 10;

    await expireCashbackCredits({
      userId: req.user.id,
    });

    const { count, rows } =
      await CashbackTransaction.findAndCountAll({
        where: {
          user_id: req.user.id,
          status: {
            [Op.ne]: "cancelled",
          },
        },
        attributes: [
          "id",
          "order_id",
          "type",
          "status",
          "amount",
          "remaining_amount",
          "available_at",
          "expires_at",
          "description",
          "createdAt",
          "updatedAt",
        ],
        include: [
          {
            model: Order,
            as: "order",
            attributes: ["id", "status", "createdAt"],
            required: false,
          },
        ],
        order: [
          ["createdAt", "DESC"],
          ["id", "DESC"],
        ],
        limit,
        offset: (page - 1) * limit,
        distinct: true,
      });

    return res.json({
      transactions: rows,
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao consultar extrato VHX Cash:", error);

    return res.status(500).json({
      error: "Não foi possível consultar o extrato VHX Cash",
    });
  }
}