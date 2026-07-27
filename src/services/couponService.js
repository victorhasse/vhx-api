import { Op } from "sequelize";

import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";
import Order from "../models/Order.js";

import {
  convertPriceToCents,
  createRequestError,
  normalizeRequestedItems,
} from "./checkoutService.js";

export function normalizeCouponCode(code) {
  return String(code || "").trim().toUpperCase();
}

export async function calculateCartSubtotal(
  items,
  { transaction } = {},
) {
  const requestedItems = normalizeRequestedItems(items);

  const productIds = [
    ...new Set(requestedItems.map((item) => item.productId)),
  ];

  const products = await Product.findAll({
    where: {
      id: {
        [Op.in]: productIds,
      },
      active: true,
    },
    transaction,
  });

  if (products.length !== productIds.length) {
    throw createRequestError(
      "Um ou mais produtos não estão disponíveis",
    );
  }

  const productsById = new Map(
    products.map((product) => [
      Number(product.id),
      product,
    ]),
  );

  const variants = await ProductVariant.findAll({
    where: {
      product_id: {
        [Op.in]: productIds,
      },
      active: true,
    },
    transaction,
  });

  const variantsById = new Map(
    variants.map((variant) => [
      Number(variant.id),
      variant,
    ]),
  );

  const productsWithVariants = new Set(
    variants.map((variant) =>
      Number(variant.product_id),
    ),
  );

  let subtotalCents = 0;

  for (const item of requestedItems) {
    const product = productsById.get(item.productId);

    if (
      productsWithVariants.has(item.productId) &&
      !item.variantId
    ) {
      throw createRequestError(
        `Selecione uma opção para o produto "${product.name}"`,
      );
    }

    let price = product.price;

    if (item.variantId) {
      const variant = variantsById.get(item.variantId);

      if (
        !variant ||
        Number(variant.product_id) !== item.productId
      ) {
        throw createRequestError(
          "Uma ou mais variantes não estão disponíveis",
        );
      }

      if (
        variant.price_override !== null &&
        variant.price_override !== undefined
      ) {
        price = variant.price_override;
      }
    }

    const unitPriceCents = convertPriceToCents(
      price,
      product.name,
    );

    subtotalCents += unitPriceCents * item.quantity;
  }

  if (
    !Number.isSafeInteger(subtotalCents) ||
    subtotalCents <= 0
  ) {
    throw createRequestError(
      "Subtotal do carrinho inválido",
    );
  }

  return {
    requestedItems,
    subtotalCents,
  };
}

export async function validateAndCalculateCoupon({
  code,
  subtotalCents,
  transaction,
  reserveUsage = false,
}) {
  const normalizedCode = normalizeCouponCode(code);

  if (!normalizedCode) {
    throw createRequestError(
      "Informe um código de cupom",
    );
  }

  const coupon = await Coupon.findOne({
    where: {
      code: normalizedCode,
    },
    transaction,
    /*
     * Durante a criação do pagamento, bloqueia o cupom.
     * Isso serializa pedidos concorrentes que tentam
     * utilizar um cupom com limite de usos.
     */
    ...(reserveUsage && transaction
      ? {
          lock: transaction.LOCK.UPDATE,
        }
      : {}),
  });

  if (!coupon) {
    throw createRequestError(
      "Cupom não encontrado",
    );
  }

  if (!coupon.active) {
    throw createRequestError(
      "Este cupom está inativo",
    );
  }

  const now = new Date();

  if (
    coupon.starts_at &&
    now < new Date(coupon.starts_at)
  ) {
    throw createRequestError(
      "Este cupom ainda não está disponível",
    );
  }

  if (
    coupon.expires_at &&
    now > new Date(coupon.expires_at)
  ) {
    throw createRequestError(
      "Este cupom expirou",
    );
  }

  const minimumOrderCents = Math.round(
    Number(coupon.minimum_order_amount || 0) * 100,
  );

  if (
    !Number.isSafeInteger(minimumOrderCents) ||
    minimumOrderCents < 0
  ) {
    throw createRequestError(
      "Valor mínimo do cupom inválido",
    );
  }

  if (subtotalCents < minimumOrderCents) {
    throw createRequestError(
      `Este cupom exige um subtotal mínimo de R$ ${(
        minimumOrderCents / 100
      ).toFixed(2)}`,
    );
  }

  if (coupon.usage_limit !== null) {
    /*
     * Um pedido pendente já reservou uma utilização.
     * Pedidos cancelados não entram na contagem.
     */
    const reservedUsageCount = await Order.count({
      where: {
        coupon_id: coupon.id,
        status: {
          [Op.in]: ["pending", "confirmed"],
        },
      },
      transaction,
    });

    if (
      reservedUsageCount >=
      Number(coupon.usage_limit)
    ) {
      throw createRequestError(
        "O limite de utilizações deste cupom foi atingido",
      );
    }
  }

  const discountValue = Number(
    coupon.discount_value,
  );

  let discountCents;

  if (coupon.discount_type === "percentage") {
    discountCents = Math.round(
      subtotalCents * (discountValue / 100),
    );
  } else if (coupon.discount_type === "fixed") {
    discountCents = Math.round(
      discountValue * 100,
    );
  } else {
    throw createRequestError(
      "Tipo de desconto inválido",
    );
  }

  discountCents = Math.min(
    discountCents,
    subtotalCents,
  );

  if (
    !Number.isSafeInteger(discountCents) ||
    discountCents <= 0
  ) {
    throw createRequestError(
      "Valor de desconto inválido",
    );
  }

  return {
    coupon,
    code: coupon.code,
    subtotalCents,
    discountCents,
    subtotalAfterDiscountCents:
      subtotalCents - discountCents,
  };
}