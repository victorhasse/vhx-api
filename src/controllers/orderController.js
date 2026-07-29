import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import sequelize from "../database/connection.js";
import { releaseOrderCashback } from "../services/cashbackService.js";

export async function getMyOrders(req, res) {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image_url"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getOrderById(req, res) {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image_url"],
            },
          ],
        },
      ],
    });
    if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
    return res.json(order);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
function normalizeOptionalText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function isValidTrackingUrl(value) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getOrderIncludes() {
  return [
    {
      model: User,
      attributes: ["id", "name", "email"],
    },
    {
      model: OrderItem,
      as: "items",
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "image_url"],
        },
      ],
    },
  ];
}

export async function getAdminOrders(req, res) {
  try {
    const orders = await Order.findAll({
      include: getOrderIncludes(),
      order: [["createdAt", "DESC"]],
    });

    return res.json(orders);
  } catch (error) {
    console.error("Erro ao listar pedidos administrativos:", error);

    return res.status(500).json({
      error: "Não foi possível carregar os pedidos",
    });
  }
}

export async function updateAdminOrder(req, res) {
  try {
    const orderId = Number(req.params.id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        error: "Pedido inválido",
      });
    }

    const requestedStatus = normalizeOptionalText(
      req.body.status,
    );

    const trackingCode = normalizeOptionalText(
      req.body.tracking_code,
    );

    const trackingCarrier = normalizeOptionalText(
      req.body.tracking_carrier,
    );

    const trackingUrl = normalizeOptionalText(
      req.body.tracking_url,
    );

    if (!requestedStatus) {
      return res.status(400).json({
        error: "Informe o novo status do pedido",
      });
    }

    if (
      requestedStatus !== "shipped" &&
      requestedStatus !== "delivered"
    ) {
      return res.status(400).json({
        error:
          "O painel permite apenas marcar pedidos como enviados ou entregues",
      });
    }

    if (
      requestedStatus === "shipped" &&
      !trackingCode
    ) {
      return res.status(400).json({
        error:
          "O código de rastreamento é obrigatório para pedidos enviados",
      });
    }

    if (trackingCode && trackingCode.length > 120) {
      return res.status(400).json({
        error:
          "O código de rastreamento deve ter no máximo 120 caracteres",
      });
    }

    if (
      trackingCarrier &&
      trackingCarrier.length > 100
    ) {
      return res.status(400).json({
        error:
          "A transportadora deve ter no máximo 100 caracteres",
      });
    }

    if (trackingUrl && trackingUrl.length > 500) {
      return res.status(400).json({
        error:
          "O link de rastreamento deve ter no máximo 500 caracteres",
      });
    }

    if (!isValidTrackingUrl(trackingUrl)) {
      return res.status(400).json({
        error:
          "Informe um link de rastreamento válido, iniciado por http:// ou https://",
      });
    }

    const result = await sequelize.transaction(
      async (transaction) => {
        const order = await Order.findByPk(orderId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!order) {
          return {
            status: 404,
            body: {
              error: "Pedido não encontrado",
            },
          };
        }

        if (
          requestedStatus === "shipped" &&
          order.status !== "confirmed" &&
          order.status !== "shipped"
        ) {
          return {
            status: 409,
            body: {
              error:
                "Somente pedidos confirmados podem ser enviados",
            },
          };
        }

        if (
          requestedStatus === "delivered" &&
          order.status !== "shipped"
        ) {
          return {
            status: 409,
            body: {
              error:
                "Somente pedidos enviados podem ser marcados como entregues",
            },
          };
        }

        if (requestedStatus === "shipped") {
          order.status = "shipped";
          order.tracking_code = trackingCode;
          order.tracking_carrier = trackingCarrier;
          order.tracking_url = trackingUrl;

          if (!order.shipped_at) {
            order.shipped_at = new Date();
          }
        }

        if (requestedStatus === "delivered") {
          order.status = "delivered";

          if (!order.delivered_at) {
            order.delivered_at = new Date();
          }
        }

        await order.save({
          transaction,
        });

        if (requestedStatus === "delivered") {
          await releaseOrderCashback({
            order,
            transaction,
          });
        }

        const updatedOrder = await Order.findByPk(
          order.id,
          {
            include: getOrderIncludes(),
            transaction,
          },
        );

        return {
          status: 200,
          body: updatedOrder,
        };
      },
    );

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);

    return res.status(500).json({
      error: "Não foi possível atualizar o pedido",
    });
  }
}