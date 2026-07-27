import Coupon from "../models/Coupon.js";

import {
  calculateCartSubtotal,
  normalizeCouponCode,
  validateAndCalculateCoupon,
} from "../services/couponService.js";

function parseOptionalDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const error = new Error("Data inválida");
    error.statusCode = 400;
    throw error;
  }

  return date;
}

function validateCouponData(data, { partial = false } = {}) {
  const discountType = data.discount_type;
  const discountValue = Number(data.discount_value);

  if (
    !partial ||
    discountType !== undefined
  ) {
    if (
      discountType !== "percentage" &&
      discountType !== "fixed"
    ) {
      throw Object.assign(
        new Error(
          "O tipo deve ser percentage ou fixed",
        ),
        { statusCode: 400 },
      );
    }
  }

  if (
    !partial ||
    data.discount_value !== undefined
  ) {
    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      throw Object.assign(
        new Error(
          "O valor do desconto deve ser maior que zero",
        ),
        { statusCode: 400 },
      );
    }

    if (
      discountType === "percentage" &&
      discountValue > 100
    ) {
      throw Object.assign(
        new Error(
          "O desconto percentual não pode ultrapassar 100%",
        ),
        { statusCode: 400 },
      );
    }
  }

  if (
    data.minimum_order_amount !== undefined &&
    (
      !Number.isFinite(
        Number(data.minimum_order_amount),
      ) ||
      Number(data.minimum_order_amount) < 0
    )
  ) {
    throw Object.assign(
      new Error(
        "O valor mínimo do pedido é inválido",
      ),
      { statusCode: 400 },
    );
  }

  if (
    data.usage_limit !== undefined &&
    data.usage_limit !== null &&
    (
      !Number.isInteger(Number(data.usage_limit)) ||
      Number(data.usage_limit) < 1
    )
  ) {
    throw Object.assign(
      new Error(
        "O limite de usos deve ser um número inteiro positivo",
      ),
      { statusCode: 400 },
    );
  }
}

function sendControllerError(res, error) {
  if (
    error.name === "SequelizeUniqueConstraintError"
  ) {
    return res.status(409).json({
      error: "Já existe um cupom com este código",
    });
  }

  return res
    .status(error.statusCode || 500)
    .json({
      error:
        error.statusCode
          ? error.message
          : "Não foi possível processar o cupom",
    });
}

export async function validateCoupon(req, res) {
  try {
    const { code, items } = req.body;

    const { subtotalCents } =
      await calculateCartSubtotal(items);

    const result =
      await validateAndCalculateCoupon({
        code,
        subtotalCents,
      });

    return res.json({
      code: result.code,
      discountType:
        result.coupon.discount_type,
      discountValue: Number(
        result.coupon.discount_value,
      ),
      subtotal: result.subtotalCents / 100,
      discountAmount:
        result.discountCents / 100,
      subtotalAfterDiscount:
        result.subtotalAfterDiscountCents / 100,
    });
  } catch (error) {
    return sendControllerError(res, error);
  }
}

export async function getAllCoupons(req, res) {
  try {
    const coupons = await Coupon.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.json(coupons);
  } catch (error) {
    return sendControllerError(res, error);
  }
}

export async function createCoupon(req, res) {
  try {
    validateCouponData(req.body);

    const startsAt = parseOptionalDate(
      req.body.starts_at,
    );

    const expiresAt = parseOptionalDate(
      req.body.expires_at,
    );

    if (
      startsAt &&
      expiresAt &&
      startsAt >= expiresAt
    ) {
      return res.status(400).json({
        error:
          "A data final deve ser posterior à data inicial",
      });
    }

    const coupon = await Coupon.create({
      code: normalizeCouponCode(req.body.code),
      discount_type: req.body.discount_type,
      discount_value: req.body.discount_value,
      minimum_order_amount:
        req.body.minimum_order_amount ?? 0,
      starts_at: startsAt,
      expires_at: expiresAt,
      usage_limit:
        req.body.usage_limit ?? null,
      active: req.body.active ?? true,
    });

    return res.status(201).json(coupon);
  } catch (error) {
    return sendControllerError(res, error);
  }
}

export async function updateCoupon(req, res) {
  try {
    const coupon = await Coupon.findByPk(
      req.params.id,
    );

    if (!coupon) {
      return res.status(404).json({
        error: "Cupom não encontrado",
      });
    }

    const data = {
      ...req.body,
    };

    if (data.code !== undefined) {
      data.code = normalizeCouponCode(data.code);
    }

    if (data.starts_at !== undefined) {
      data.starts_at = parseOptionalDate(
        data.starts_at,
      );
    }

    if (data.expires_at !== undefined) {
      data.expires_at = parseOptionalDate(
        data.expires_at,
      );
    }

    const finalType =
      data.discount_type ??
      coupon.discount_type;

    validateCouponData(
      {
        ...data,
        discount_type: finalType,
      },
      { partial: true },
    );

    const finalStartsAt =
      data.starts_at !== undefined
        ? data.starts_at
        : coupon.starts_at;

    const finalExpiresAt =
      data.expires_at !== undefined
        ? data.expires_at
        : coupon.expires_at;

    if (
      finalStartsAt &&
      finalExpiresAt &&
      new Date(finalStartsAt) >=
        new Date(finalExpiresAt)
    ) {
      return res.status(400).json({
        error:
          "A data final deve ser posterior à data inicial",
      });
    }

    const allowedFields = [
      "code",
      "discount_type",
      "discount_value",
      "minimum_order_amount",
      "starts_at",
      "expires_at",
      "usage_limit",
      "active",
    ];

    const updates = Object.fromEntries(
      Object.entries(data).filter(([key]) =>
        allowedFields.includes(key),
      ),
    );

    await coupon.update(updates);

    return res.json(coupon);
  } catch (error) {
    return sendControllerError(res, error);
  }
}

export async function updateCouponStatus(req, res) {
  try {
    const coupon = await Coupon.findByPk(
      req.params.id,
    );

    if (!coupon) {
      return res.status(404).json({
        error: "Cupom não encontrado",
      });
    }

    if (typeof req.body.active !== "boolean") {
      return res.status(400).json({
        error:
          "O campo active deve ser verdadeiro ou falso",
      });
    }

    await coupon.update({
      active: req.body.active,
    });

    return res.json(coupon);
  } catch (error) {
    return sendControllerError(res, error);
  }
}