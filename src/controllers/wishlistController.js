import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import ProductImage from "../models/ProductImage.js";

export async function getWishlist(req, res) {
  try {
    const wishlistItems = await Wishlist.findAll({
      where: {
        user_id: req.user.id,
      },

      attributes: [
        "id",
        "product_id",
        "createdAt",
      ],

      include: [
        {
          model: Product,
          as: "product",
          required: true,

          where: {
            active: true,
          },

          attributes: [
            "id",
            "name",
            "description",
            "price",
            "category",
            "image_url",
            "stock",
            "badge",
            "active",
          ],

          include: [
            {
              model: ProductImage,
              as: "images",
              required: false,

              attributes: [
                "id",
                "image_url",
                "alt_text",
                "sort_order",
                "is_primary",
                "product_color_id",
              ],
            },
          ],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return res.json(wishlistItems);
  } catch (error) {
    console.error(
      "Erro ao listar wishlist:",
      error,
    );

    return res.status(500).json({
      error:
        "Não foi possível carregar a lista de desejos",
    });
  }
}

export async function addToWishlist(
  req,
  res,
) {
  try {
    const productId = Number(
      req.params.productId,
    );

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        error: "Produto inválido",
      });
    }

    const product = await Product.findOne({
      where: {
        id: productId,
        active: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        error: "Produto não encontrado",
      });
    }

    const [wishlistItem, created] =
      await Wishlist.findOrCreate({
        where: {
          user_id: req.user.id,
          product_id: productId,
        },

        defaults: {
          user_id: req.user.id,
          product_id: productId,
        },
      });

    if (!created) {
      return res.status(200).json({
        message:
          "Produto já está na lista de desejos",
        wishlistItem,
      });
    }

    return res.status(201).json({
      message:
        "Produto adicionado à lista de desejos",
      wishlistItem,
    });
  } catch (error) {
    /*
     * Proteção adicional caso duas requisições
     * tentem inserir o mesmo produto simultaneamente.
     */
    if (
      error.name ===
      "SequelizeUniqueConstraintError"
    ) {
      return res.status(200).json({
        message:
          "Produto já está na lista de desejos",
      });
    }

    console.error(
      "Erro ao adicionar à wishlist:",
      error,
    );

    return res.status(500).json({
      error:
        "Não foi possível adicionar o produto à lista de desejos",
    });
  }
}

export async function removeFromWishlist(
  req,
  res,
) {
  try {
    const productId = Number(
      req.params.productId,
    );

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        error: "Produto inválido",
      });
    }

    const removed = await Wishlist.destroy({
      where: {
        user_id: req.user.id,
        product_id: productId,
      },
    });

    if (!removed) {
      return res.status(404).json({
        error:
          "Produto não encontrado na lista de desejos",
      });
    }

    return res.json({
      message:
        "Produto removido da lista de desejos",
    });
  } catch (error) {
    console.error(
      "Erro ao remover da wishlist:",
      error,
    );

    return res.status(500).json({
      error:
        "Não foi possível remover o produto da lista de desejos",
    });
  }
}